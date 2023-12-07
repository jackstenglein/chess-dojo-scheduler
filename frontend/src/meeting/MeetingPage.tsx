import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Stack,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Link,
    Button,
} from '@mui/material';

import { Event, getDisplayString } from '../database/event';
import GraduationIcon from '../scoreboard/GraduationIcon';
import { useCache } from '../api/cache/Cache';
import LoadingPage from '../loading/LoadingPage';
import { useAuth } from '../auth/Auth';
import Avatar from '../profile/Avatar';
import NotFoundPage from '../NotFoundPage';
import CancelMeetingButton from './CancelMeetingButton';
import { toDojoTimeString } from '../calendar/displayDate';

const ownerCancelDialog =
    'Ownership of this meeting will be transferred to your opponent and other users will be able to book the meeting.';
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
    const startDate = start.toLocaleDateString();
    const startTime = toDojoTimeString(start, user.timeFormat);

    let opponent = Object.values(meeting.participants)[0];

    if (!opponent) {
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

    if (opponent.username === user.username) {
        opponent = {
            username: meeting.owner,
            displayName: meeting.ownerDisplayName,
            cohort: meeting.ownerCohort,
            previousCohort: meeting.ownerPreviousCohort,
        };
    }

    return (
        <Container maxWidth='md' sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardHeader
                        title={
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                flexWrap='wrap'
                                rowGap={1}
                            >
                                <Typography variant='h5' mr={1}>
                                    Meeting Details
                                </Typography>

                                <CancelMeetingButton
                                    meetingId={meeting.id}
                                    dialogTitle='Cancel this meeting?'
                                    dialogContent={
                                        meeting.owner === user.username
                                            ? ownerCancelDialog
                                            : participantCancelDialog
                                    }
                                    onSuccess={onCancel}
                                >
                                    Cancel Meeting
                                </CancelMeetingButton>
                            </Stack>
                        }
                    />
                    <CardContent>
                        <Stack spacing={3}>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Start Time
                                </Typography>
                                <Typography variant='body1'>
                                    {startDate} {startTime}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Meeting Type
                                </Typography>
                                <Typography variant='body1'>
                                    {getDisplayString(meeting.bookedType)}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Location
                                </Typography>
                                <Typography variant='body1'>
                                    {meeting.location || 'Discord'}
                                </Typography>
                            </Stack>

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
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant='outlined'>
                    <CardHeader title='Opponent' />
                    <CardContent>
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <Avatar
                                username={opponent.username}
                                displayName={opponent.displayName}
                                size={25}
                            />
                            <Link
                                component={RouterLink}
                                to={`/profile/${opponent.username}`}
                            >
                                <Typography variant='body1'>
                                    {opponent.displayName} ({opponent.cohort})
                                </Typography>
                            </Link>
                            <GraduationIcon cohort={opponent.previousCohort} size={22} />
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default MeetingPage;
