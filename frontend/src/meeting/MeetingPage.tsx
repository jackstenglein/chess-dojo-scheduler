import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    CircularProgress,
    Container,
    Stack,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Alert,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { getDisplayString } from '../database/availability';
import { GetMeetingResponse } from '../api/meetingApi';
import { MeetingStatus } from '../database/meeting';
import GraduationIcon from '../scoreboard/GraduationIcon';

const MeetingPage = () => {
    const api = useApi();
    const { meetingId } = useParams();
    const request = useRequest<GetMeetingResponse>();

    const [isCanceling, setIsCanceling] = useState(false);
    const cancelRequest = useRequest();

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

    const onCancel = () => {
        cancelRequest.onStart();

        api.cancelMeeting(meetingId!)
            .then((response) => {
                console.log('Cancel meeting response: ', response);
                request.onSuccess({ ...request.data!, meeting: response.data });
                setIsCanceling(false);
                cancelRequest.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                cancelRequest.onFailure(err);
            });
    };

    const meeting = request.data.meeting;
    const opponent = request.data.opponent;
    const start = new Date(meeting.startTime);
    const startDate = start.toLocaleDateString();
    const startTime = start.toLocaleTimeString();

    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Dialog open={isCanceling} onClose={() => setIsCanceling(false)}>
                <RequestSnackbar request={cancelRequest} />
                <DialogTitle>
                    Cancel this meeting?
                    <IconButton
                        aria-label='close'
                        onClick={() => setIsCanceling(false)}
                        sx={{
                            position: 'absolute',
                            right: 10,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to cancel this meeting? You can't undo this
                        action.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <LoadingButton onClick={onCancel} loading={cancelRequest.isLoading()}>
                        Cancel Meeting
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <Stack spacing={4}>
                {meeting.status === MeetingStatus.Canceled && (
                    <Alert severity='error'>This meeting has been canceled.</Alert>
                )}

                <Card variant='outlined'>
                    <CardHeader
                        title='Meeting Details'
                        action={
                            meeting.status !== MeetingStatus.Canceled ? (
                                <Button
                                    variant='contained'
                                    color='error'
                                    onClick={() => setIsCanceling(true)}
                                >
                                    Cancel Meeting
                                </Button>
                            ) : undefined
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
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <Link to={`/profile/${opponent.username}`}>
                                        <Typography variant='body1'>
                                            {opponent.discordUsername}
                                        </Typography>
                                    </Link>
                                    <GraduationIcon
                                        cohort={opponent.previousCohort}
                                        size={25}
                                    />
                                </Stack>
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
