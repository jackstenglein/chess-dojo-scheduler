import { Box, Container, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import LeaderboardTab from './LeaderboardTab';
import InfoTab from './InfoTab';
import CalendarTab from './CalendarTab';
import Icon from '../style/Icon';
const TournamentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({
        type: 'calendar',
    });

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <TabContext value={searchParams.get('type') || 'calendar'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        data-cy='tournaments-tab-list'
                        onChange={(_, t) => setSearchParams({ type: t })}
                        variant='scrollable'
                    >
                        <Tab label='Calendar' value='calendar' icon={<Icon name='ligaCalendar' color='primary'/>} iconPosition='start'/>
                        <Tab label='Leaderboard' value='leaderboard' icon={<Icon name='leaderboard' color='primary'/>} iconPosition='start' />
                        <Tab label='Info' value='info' icon={<Icon name='info' color='primary'/>} iconPosition='start'/>
                    </TabList>
                </Box>

                <TabPanel value='calendar' sx={{ px: 0 }}>
                    <CalendarTab />
                </TabPanel>

                <TabPanel value='leaderboard' sx={{ px: 0 }}>
                    <LeaderboardTab />
                </TabPanel>

                <TabPanel value='info' sx={{ px: 0 }}>
                    <InfoTab />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default TournamentsPage;
