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
    Alert,
} from '@mui/material';

import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { getDisplayString } from '../database/availability';
import { GetMeetingResponse } from '../api/meetingApi';

const MeetingPage = () => {
    const api = useApi();
    const { meetingId } = useParams();
    const request = useRequest<GetMeetingResponse>();

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

    if (request.isLoading() || !request.isSent()) {
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

    const meeting = request.data.meeting;
    const opponent = request.data.opponent;
    const start = new Date(meeting.startTime);
    const startDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString();

    const opponentIsOwner = meeting.owner === opponent.username;

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Stack spacing={4}>
                {opponentIsOwner && (
                    <Alert severity='warning'>
                        This website does not have notifications yet. Please message your
                        opponent on discord and let them know you booked their meeting.
                        Otherwise, they may not know they're supposed to play you.
                    </Alert>
                )}

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
                        <Stack spacing={3}>
                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Discord Username
                                </Typography>
                                <Typography variant='body1'>
                                    {opponent.discordUsername}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Chess Dojo Cohort
                                </Typography>
                                <Typography variant='body1'>
                                    {opponent.dojoCohort}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Chess.com Username
                                </Typography>
                                <Typography variant='body1'>
                                    {opponent.chesscomUsername}
                                </Typography>
                            </Stack>

                            <Stack>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Lichess Username
                                </Typography>
                                <Typography variant='body1'>
                                    {opponent.lichessUsername}
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Container>
    );
};

export default MeetingPage;
