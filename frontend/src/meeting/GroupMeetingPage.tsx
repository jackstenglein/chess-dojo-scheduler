import {
    Card,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Typography,
    Link,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { useCache } from '../api/cache/Cache';
import { getDisplayString } from '../database/event';
import GraduationIcon from '../scoreboard/GraduationIcon';
import LoadingPage from '../loading/LoadingPage';

const GroupMeetingPage = () => {
    const { availabilityId } = useParams();
    const cache = useCache();

    const availability = cache.events.get(availabilityId!);
    if (!availability) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }

        return (
            <Container sx={{ pt: 6, pb: 4 }}>
                <Typography variant='subtitle2'>Meeting not found</Typography>
            </Container>
        );
    }

    const start = new Date(availability.startTime);
    const startDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString();

    const end = new Date(availability.endTime);
    const endTime = end.toLocaleTimeString();

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardHeader title='Meeting Details' />
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
                            <Stack direction='row' spacing={2} alignItems='center'>
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
                                    size={25}
                                />
                            </Stack>

                            {availability.participants!.map((p) => (
                                <Stack
                                    key={p.username}
                                    direction='row'
                                    spacing={2}
                                    alignItems='center'
                                >
                                    <Link
                                        component={RouterLink}
                                        to={`/profile/${p.username}`}
                                    >
                                        <Typography variant='body1'>
                                            {p.displayName} ({p.cohort})
                                        </Typography>
                                    </Link>
                                    <GraduationIcon cohort={p.previousCohort} size={25} />
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
