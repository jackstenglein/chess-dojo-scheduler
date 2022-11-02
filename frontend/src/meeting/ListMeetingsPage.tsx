import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

import { Meeting } from '../database/meeting';
import MeetingListItem from './MeetingListItem';

const ListMeetingsPage = () => {
    const api = useApi();
    const navigate = useNavigate();

    const request = useRequest<Meeting[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            api.listMeetings()
                .then((result) => {
                    result.sort((lhs, rhs) => lhs.startTime.localeCompare(rhs.startTime));
                    request.onSuccess(result);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const meetings = request.data ?? [];

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2} alignItems='start'>
                <Typography variant='h4'>Meetings</Typography>

                {request.isLoading() || (!request.isSent() && <CircularProgress />)}

                {meetings.length === 0 && (
                    <>
                        <Typography variant='body1'>
                            Looks like you don't have any meetings. Go to the calendar and
                            schedule one now!
                        </Typography>
                        <Button variant='contained' onClick={() => navigate('/calendar')}>
                            Go to Calendar
                        </Button>
                    </>
                )}

                {meetings.map((meeting) => (
                    <MeetingListItem key={meeting.id} meeting={meeting} />
                ))}
            </Stack>
        </Container>
    );
};

export default ListMeetingsPage;
