import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Stack,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Button,
} from '@mui/material';

import { Event, getDisplayString } from '../database/event';
import { useCache } from '../api/cache/Cache';
import LoadingPage from '../loading/LoadingPage';
import { useAuth } from '../auth/Auth';
import NotFoundPage from '../NotFoundPage';
import CancelMeetingButton from './CancelMeetingButton';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';
import Field from '../calendar/eventViewer/Field';
import ParticipantsList from '../calendar/eventViewer/ParticipantsList';
import { dojoCohorts } from '../database/user';

const soloMeetingOwnerCancelDialog =
    'Ownership of this meeting will be transferred to your opponent and other users will be able to book the meeting.';
const groupMeetingOwnerCancelDialog =
    'Ownership of this meeting will be transferred to one of the participants, and you may not be able to re-join it later if other users book it.';
const participantCancelDialog =
    'This will allow the meeting to be booked by other users and you may not be able to re-book it.';

const MeetingPage = () => {
    const { meetingId } = useParams();
    const cache = useCache();
    const user = useAuth().user!;
    const navigate = useNavigate();

    const meeting = cache.events.get(meetingId!);
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
        navigate('/calendar', { state: { canceled: true } });
        cache.events.put(event);
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
                    onClick={() => navigate('/calendar')}
                    variant='contained'
                    sx={{ mt: 2 }}
                >
                    Return to Calendar
                </Button>
            </Container>
        );
    }

    const isSolo = meeting.maxParticipants === 1;

    let cancelDialogTitle = 'Cancel this meeting?';
    let cancelDialogContent = participantCancelDialog;

    if (isSolo && meeting.owner === user.username) {
        cancelDialogContent = soloMeetingOwnerCancelDialog;
    } else if (!isSolo) {
        cancelDialogTitle = 'Leave this meeting?';
        if (meeting.owner === user.username) {
            cancelDialogContent = groupMeetingOwnerCancelDialog;
        }
    }

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardHeader
                        title='Meeting Details'
                        action={
                            <CancelMeetingButton
                                meetingId={meeting.id}
                                dialogTitle={cancelDialogTitle}
                                dialogContent={cancelDialogContent}
                                onSuccess={onCancel}
                            >
                                {isSolo ? 'Cancel' : 'Leave'} Meeting
                            </CancelMeetingButton>
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
                                              .map((t) => getDisplayString(t))
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
                    <CardHeader title='Participants' />
                    <CardContent>
                        <ParticipantsList event={meeting} />
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default MeetingPage;
