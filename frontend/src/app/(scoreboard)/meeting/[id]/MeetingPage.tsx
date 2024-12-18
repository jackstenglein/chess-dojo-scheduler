'use client';

import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useCache } from '@/api/cache/Cache';
import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/calendar/displayDate';
import Field from '@/components/calendar/eventViewer/Field';
import ParticipantsList from '@/components/calendar/eventViewer/ParticipantsList';
import { Event, EventStatus, EventType, getDisplayString } from '@/database/event';
import { User, dojoCohorts } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import CancelMeetingButton from '@/meeting/CancelMeetingButton';
import MeetingMessages from '@/meeting/MeetingMessages';
import { Warning } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';

const CANCELATION_DEADLINE = 24 * 1000 * 60 * 60; // 24 hours

/**
 * Returns the cancel dialog title and content for the given user and meeting.
 * @param user The user canceling the meeting.
 * @param meeting The meeting being canceled.
 * @returns An array containing the cancel dialog button, title and content.
 */
function getCancelDialog(user: User, meeting: Event): [string, string, string] {
    const isOwner = meeting.owner === user.username;
    const isCoaching = meeting.type === EventType.Coaching;

    if (isOwner && isCoaching) {
        return [
            'Cancel Meeting',
            'Cancel this meeting?',
            'Canceling this meeting will refund all participants.',
        ];
    } else if (isCoaching) {
        const now = new Date().getTime();
        const cancelationTime =
            new Date(meeting.bookedStartTime || meeting.startTime).getTime() -
            CANCELATION_DEADLINE;
        if (now >= cancelationTime) {
            return [
                'Leave Meeting',
                'Leave this meeting?',
                'It is within 24 hours of the start of the meeting, so you will not receive a refund.',
            ];
        }
        return [
            'Leave Meeting',
            'Leave this meeting?',
            'It is greater than 24 hours before the start of the meeting, so you will receive a full refund.',
        ];
    }

    const isSolo = meeting.maxParticipants === 1;
    if (isSolo && isOwner) {
        return [
            'Cancel Meeting',
            'Cancel this meeting?',
            'Ownership of this meeting will be transferred to your opponent and other users will be able to book the meeting.',
        ];
    } else if (isOwner) {
        return [
            'Leave Meeting',
            'Leave this meeting?',
            'Ownership of this meeting will be transferred to one of the participants, and you may not be able to re-join it later if other users book it.',
        ];
    } else if (isSolo) {
        return [
            'Cancel Meeting',
            'Cancel this meeting?',
            'This will allow the meeting to be booked by other users and you may not be able to re-book it.',
        ];
    } else {
        return [
            'Leave Meeting',
            'Leave this meeting?',
            'This will allow the meeting to be booked by other users and you may not be able to re-book it.',
        ];
    }
}

export function MeetingPage({ meetingId }: { meetingId: string }) {
    const cache = useCache();
    const { user } = useAuth();
    const checkoutRequest = useRequest();
    const api = useApi();
    const router = useRouter();

    if (!user) {
        return <LoadingPage />;
    }

    const meeting = cache.events.get(meetingId || '');
    if (!meeting) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }
        return <NotFoundPage />;
    }

    if (
        meeting.owner !== user.username &&
        !Object.keys(meeting.participants).includes(user.username)
    ) {
        return <NotFoundPage />;
    }

    const onCancel = (event: Event) => {
        cache.events.put(event);
        router.push('/calendar');
    };

    const start = new Date(meeting.bookedStartTime || meeting.startTime);
    const startDate = toDojoDateString(start, user.timezoneOverride);
    const startTime = toDojoTimeString(start, user.timezoneOverride, user.timeFormat);

    const end = new Date(meeting.endTime);
    const endTime = toDojoTimeString(end, user.timezoneOverride, user.timeFormat);

    if (Object.values(meeting.participants).length === 0) {
        return (
            <Container maxWidth='md' sx={{ py: 4 }}>
                <Typography>This meeting has not been booked yet.</Typography>
                <Button
                    component={NextLink}
                    href='/calendar'
                    variant='contained'
                    sx={{ mt: 2 }}
                >
                    Return to Calendar
                </Button>
            </Container>
        );
    }

    const isOwner = meeting.owner === user.username;
    const isCoaching = meeting.type === EventType.Coaching;
    const isSolo = meeting.maxParticipants === 1;
    const isCanceled = meeting.status === EventStatus.Canceled;
    const participant = meeting.participants[user.username];

    const [cancelButton, cancelDialogTitle, cancelDialogContent] = getCancelDialog(
        user,
        meeting,
    );

    const onCompletePayment = () => {
        if (!meetingId) {
            return;
        }

        checkoutRequest.onStart();
        api.getEventCheckout(meetingId)
            .then((resp) => {
                window.location.href = resp.data.url;
            })
            .catch((err) => {
                console.error('getEventCheckout: ', err);
                checkoutRequest.onFailure(err);
            });
    };

    console.log('Meeting: ', meeting);

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            <RequestSnackbar request={checkoutRequest} />

            <Stack spacing={4}>
                {isCoaching && !isOwner && !participant.hasPaid && !isCanceled && (
                    <Alert
                        severity='warning'
                        variant='filled'
                        action={
                            <LoadingButton
                                color='inherit'
                                size='small'
                                loading={checkoutRequest.isLoading()}
                                onClick={onCompletePayment}
                            >
                                Complete Payment
                            </LoadingButton>
                        }
                    >
                        You have not completed payment for this coaching session and will
                        lose your booking soon.
                    </Alert>
                )}

                {isCoaching && isCanceled && (
                    <Alert severity='warning' variant='filled'>
                        This meeting has been canceled by the coach. If you have already
                        completed payment, you will receive a full refund.
                    </Alert>
                )}

                <Card variant='outlined'>
                    <CardHeader
                        title={meeting.title || 'Meeting Details'}
                        action={
                            !isCanceled && (
                                <CancelMeetingButton
                                    meetingId={meeting.id}
                                    dialogTitle={cancelDialogTitle}
                                    dialogContent={cancelDialogContent}
                                    onSuccess={onCancel}
                                >
                                    {cancelButton}
                                </CancelMeetingButton>
                            )
                        }
                    />
                    <CardContent>
                        <Stack spacing={3}>
                            <Field
                                title='Time'
                                body={`${startDate} ${startTime} - ${endTime}`}
                            />

                            {meeting.description && (
                                <Stack>
                                    <Typography
                                        variant='subtitle2'
                                        color='text.secondary'
                                    >
                                        Description
                                    </Typography>
                                    <Typography
                                        variant='body1'
                                        style={{ whiteSpace: 'pre-line' }}
                                    >
                                        {meeting.description}
                                    </Typography>
                                </Stack>
                            )}

                            <Field
                                title='Location'
                                body={meeting.location || 'Discord'}
                            />

                            <Field
                                title='Meeting Type(s)'
                                body={
                                    meeting.bookedType
                                        ? getDisplayString(meeting.bookedType)
                                        : meeting.types
                                              ?.map((t) => getDisplayString(t))
                                              .join(', ')
                                }
                            />

                            {!isSolo && (
                                <Field
                                    title='Cohorts'
                                    body={
                                        meeting.cohorts.length === dojoCohorts.length
                                            ? 'All Cohorts'
                                            : meeting.cohorts.join(', ')
                                    }
                                />
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant='outlined'>
                    <CardHeader
                        title={
                            <Stack direction='row' spacing={2} alignItems='center'>
                                <Typography variant='h5'>Participants</Typography>
                                {isCoaching &&
                                    isOwner &&
                                    Object.values(meeting.participants).some(
                                        (p) => !p.hasPaid,
                                    ) && (
                                        <Tooltip title='Some users have not paid and will lose their booking in ~30 min'>
                                            <Warning color='warning' />
                                        </Tooltip>
                                    )}
                            </Stack>
                        }
                    />
                    <CardContent>
                        <ParticipantsList
                            event={meeting}
                            showPaymentWarning={isCoaching}
                        />
                    </CardContent>
                </Card>

                <MeetingMessages meetingId={meetingId} />
            </Stack>
        </Container>
    );
}
