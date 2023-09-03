import { Box, Container, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import LeaderboardTab from './LeaderboardTab';
import InfoTab from './InfoTab';
import CalendarTab from './CalendarTab';

const TournamentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({
        type: 'calendar',
    });

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <TabContext value={searchParams.get('type') || 'calendar'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        onChange={(_, t) => setSearchParams({ type: t })}
                        variant='scrollable'
                    >
                        <Tab label='Calendar' value='calendar' />
                        <Tab label='Leaderboard' value='leaderboard' />
                        <Tab label='Info' value='info' />
                    </TabList>
                </Box>

                <TabPanel value='calendar'>
                    <CalendarTab />
                </TabPanel>

                <TabPanel value='leaderboard'>
                    <LeaderboardTab />
                </TabPanel>

                <TabPanel value='info'>
                    <InfoTab />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default TournamentsPage;
