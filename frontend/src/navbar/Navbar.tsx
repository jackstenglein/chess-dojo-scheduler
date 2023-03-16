import { AppBar, Container, Toolbar } from '@mui/material';

import { useCalendar } from '../api/cache/Cache';
import { useAuth } from '../auth/Auth';
import { Meeting, MeetingStatus } from '../database/meeting';
import NavbarMenu from './NavbarMenu';

const ONE_HOUR = 3600000;

const Navbar = () => {
    const auth = useAuth();

    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();
    const { meetings, availabilities } = useCalendar();

    const meetingCount = meetings.filter((m: Meeting) => {
        if (m.owner !== auth.user?.username && m.participant !== auth.user?.username) {
            return false;
        }
        return m.status !== MeetingStatus.Canceled && m.startTime >= filterTime;
    }).length;

    const groupCount = availabilities.filter((a) => {
        if (a.endTime <= filterTime) {
            return false;
        }
        if (a.owner === auth.user?.username && (a.participants?.length ?? 0) > 0) {
            return true;
        }
        if (a.participants?.some((p) => p.username === auth.user?.username)) {
            return true;
        }

        return false;
    }).length;

    const count = meetingCount + groupCount;
    const meetingText = count > 0 ? `Meetings (${count})` : `Meetings`;

    return (
        <AppBar position='sticky' sx={{ zIndex: 1300 }}>
            <Container maxWidth='xl'>
                <Toolbar disableGutters>
                    <NavbarMenu meetingText={meetingText} />
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
