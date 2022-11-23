import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../api/Cache';
import { RequestSnackbar } from '../api/Request';
import { useAuth } from '../auth/Auth';

import { Meeting } from '../database/meeting';
import MeetingListItem from './MeetingListItem';

const ONE_HOUR = 3600000;

const ListMeetingsPage = () => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();
    const meetingFilter = (m: Meeting) => {
        if (m.owner !== user.username && m.participant !== user.username) {
            return false;
        }
        return m.startTime >= filterTime;
    };

    const { meetings, request } = useMeetings();
    const requestLoading = request.isLoading() || !request.isSent();

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2} alignItems='start'>
                <Typography variant='h4'>Meetings</Typography>

                {requestLoading && meetings.length === 0 && <CircularProgress />}

                {!requestLoading && meetings.length === 0 && (
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

                {meetings.filter(meetingFilter).map((meeting) => (
                    <MeetingListItem key={meeting.id} meeting={meeting} />
                ))}
            </Stack>
        </Container>
    );
};

export default ListMeetingsPage;
