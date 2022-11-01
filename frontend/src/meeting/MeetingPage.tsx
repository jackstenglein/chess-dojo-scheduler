import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    CircularProgress,
    Container,
    Stack,
    Card,
    CardHeader,
    CardContent,
    Typography,
} from '@mui/material';

import { Meeting } from '../database/meeting';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { getDisplayString } from '../database/availability';

const MeetingPage = () => {
    const api = useApi();
    const { meetingId } = useParams();
    const request = useRequest<Meeting>();

    const fetchMeeting = useCallback(() => {
        request.onStart();
        api.getMeeting(meetingId!)
            .then((response) => {
                request.onSuccess(response.data);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    }, [request, api, meetingId]);

    useEffect(() => {
        if (!request.isSent()) {
            fetchMeeting();
        }
    }, [request, fetchMeeting]);

    if (request.isLoading()) {
        return (
            <Container sx={{ pt: 6, pb: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!request.data) {
        return (
            <Container sx={{ pt: 6, pb: 4 }}>
                <Typography variant='subtitle2'>Meeting not found</Typography>
            </Container>
        );
    }

    const meeting = request.data;
    const start = new Date(meeting.startTime);
    const startDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString();

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardHeader title='Meeting Details' />
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
                                    {getDisplayString(meeting.type)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
                <Card variant='outlined'>
                    <CardHeader title='Opponent' />
                    <CardContent></CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default MeetingPage;
