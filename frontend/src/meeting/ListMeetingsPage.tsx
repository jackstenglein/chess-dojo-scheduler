import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../api/cache/Cache';
import { RequestSnackbar } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Event } from '../database/event';

import GroupMeetingListItem from './GroupMeetingListItem';
import MeetingListItem from './MeetingListItem';

const ONE_HOUR = 3600000;

const ListMeetingsPage = () => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    const { events, request } = useEvents();
    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();

    const meetingFilter = (e: Event) => {
        if (Object.values(e.participants).length === 0) {
            return false;
        }
        if (e.owner !== user.username && !e.participants[user.username]) {
            return false;
        }
        return e.endTime >= filterTime;
    };

    const meetings: Event[] = events.filter(meetingFilter);
    meetings.sort((lhs, rhs) =>
        (lhs.bookedStartTime || lhs.startTime).localeCompare(
            rhs.bookedStartTime || rhs.startTime
        )
    );

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

                {meetings.map((e) => {
                    if (e.maxParticipants === 1) {
                        return <MeetingListItem key={e.id} meeting={e} />;
                    }

                    return <GroupMeetingListItem key={e.id} availability={e} />;
                })}
            </Stack>
        </Container>
    );
};

export default ListMeetingsPage;
