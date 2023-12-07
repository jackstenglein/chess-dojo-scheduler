import {
    Card,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Typography,
    Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';

import { useCache } from '../api/cache/Cache';
import { Event, getDisplayString } from '../database/event';
import GraduationIcon from '../scoreboard/GraduationIcon';
import LoadingPage from '../loading/LoadingPage';
import Avatar from '../profile/Avatar';
import CancelMeetingButton from './CancelMeetingButton';
import NotFoundPage from '../NotFoundPage';
import { useAuth } from '../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';

const ownerCancelDialog =
    'Ownership of this meeting will be transferred to one of the participants, and you may not be able to re-join it later if other users book it.';
const participantCancelDialog =
    'This will allow the meeting to be booked by other users and you may not be able to re-book it.';

const GroupMeetingPage = () => {
    const { availabilityId } = useParams();
    const cache = useCache();
    const navigate = useNavigate();
    const user = useAuth().user!;

    const availability = cache.events.get(availabilityId!);
    if (!availability) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }

        return <NotFoundPage />;
    }

    if (
        availability.owner !== user.username &&
        !Object.keys(availability.participants).includes(user.username)
    ) {
        return <NotFoundPage />;
    }

    const onCancel = (event: Event) => {
        navigate('/calendar', { state: { canceled: true } });
        cache.events.put(event);
    };

    const start = new Date(availability.startTime);
    const startDate = toDojoDateString(start, user.timezoneOverride);
    const startTime = toDojoTimeString(start, user.timezoneOverride, user.timeFormat);

    const end = new Date(availability.endTime);
    const endTime = toDojoTimeString(end, user.timezoneOverride, user.timeFormat);

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardHeader
                        title='Meeting Details'
                        action={
                            <CancelMeetingButton
                                meetingId={availability.id}
                                dialogTitle='Leave this meeting?'
                                dialogContent={
                                    availability.owner === user.username
                                        ? ownerCancelDialog
                                        : participantCancelDialog
                                }
                                onSuccess={onCancel}
                            >
                                Leave Meeting
                            </CancelMeetingButton>
                        }
                    />
                    <CardContent>
                        <Stack spacing={3}>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Time
                                </Typography>
                                <Typography variant='body1'>
                                    {startDate} {startTime} - {endTime}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Meeting Type(s)
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.types
                                        .map((t) => getDisplayString(t))
                                        .join(', ')}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Location
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.location || 'Discord'}
                                </Typography>
                            </Stack>

                            {availability.description && (
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
                                        {availability.description}
                                    </Typography>
                                </Stack>
                            )}

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Cohorts
                                </Typography>
                                <Typography variant='body1'>
                                    {availability.cohorts.join(', ')}
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant='outlined'>
                    <CardHeader title='Participants' />
                    <CardContent>
                        <Stack spacing={2}>
                            <Stack direction='row' spacing={1} alignItems='center'>
                                <Avatar
                                    username={availability.owner}
                                    displayName={availability.ownerDisplayName}
                                    size={25}
                                />
                                <Link
                                    component={RouterLink}
                                    to={`/profile/${availability.owner}`}
                                >
                                    <Typography variant='body1'>
                                        {availability.ownerDisplayName} (
                                        {availability.ownerCohort})
                                    </Typography>
                                </Link>
                                <GraduationIcon
                                    cohort={availability.ownerPreviousCohort}
                                    size={22}
                                />
                            </Stack>

                            {Object.values(availability.participants).map((p) => (
                                <Stack
                                    key={p.username}
                                    direction='row'
                                    spacing={1}
                                    alignItems='center'
                                >
                                    <Avatar
                                        username={p.username}
                                        displayName={p.displayName}
                                        size={25}
                                    />
                                    <Link
                                        component={RouterLink}
                                        to={`/profile/${p.username}`}
                                    >
                                        <Typography variant='body1'>
                                            {p.displayName} ({p.cohort})
                                        </Typography>
                                    </Link>
                                    <GraduationIcon cohort={p.previousCohort} size={22} />
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default GroupMeetingPage;
