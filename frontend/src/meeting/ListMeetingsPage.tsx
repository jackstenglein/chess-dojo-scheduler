import { Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCalendar } from '../api/cache/Cache';
import { RequestSnackbar } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Availability } from '../database/availability';

import { Meeting } from '../database/meeting';
import GroupMeetingListItem from './GroupMeetingListItem';
import MeetingListItem from './MeetingListItem';

const ONE_HOUR = 3600000;

const ListMeetingsPage = () => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    const { meetings: allMeetings, availabilities, request } = useCalendar();
    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();

    const meetingFilter = (m: Meeting) => {
        if (m.owner !== user.username && m.participant !== user.username) {
            return false;
        }
        return m.startTime >= filterTime;
    };
    const meetings: any[] = allMeetings.filter(meetingFilter);

    const groupFilter = (a: Availability) => {
        if (a.endTime < filterTime) {
            return false;
        }
        if (a.owner === user.username && (a.participants?.length ?? 0) > 0) {
            return true;
        }
        if (a.participants?.some((p) => p.username === user.username)) {
            return true;
        }
        return false;
    };
    const groups = availabilities.filter(groupFilter);

    const events: Array<Meeting | Availability> = meetings.concat(groups);
    events.sort((lhs, rhs) => lhs.startTime.localeCompare(rhs.startTime));

    const requestLoading = request.isLoading() || !request.isSent();

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2} alignItems='start'>
                <Typography variant='h4'>Meetings</Typography>

                {requestLoading && events.length === 0 && <CircularProgress />}

                {!requestLoading && events.length === 0 && (
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

                {events.map((e) => {
                    if ((e as Availability).participants !== undefined) {
                        return (
                            <GroupMeetingListItem
                                key={e.id}
                                availability={e as Availability}
                            />
                        );
                    }

                    return <MeetingListItem key={e.id} meeting={e as Meeting} />;
                })}
            </Stack>
        </Container>
    );
};

export default ListMeetingsPage;
