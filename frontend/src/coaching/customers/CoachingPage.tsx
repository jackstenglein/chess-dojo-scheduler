import { TabContext, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import UpcomingSessions from './UpcomingSessions';
import CoachesTab from './CoachesTab';

const CoachingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({ view: 'coaches' });

    return (
        <Container>
            <TabContext value={searchParams.get('view') || 'coaches'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={searchParams.get('view') || 'coaches'}
                        onChange={(_, t) => setSearchParams({ view: t })}
                        variant='scrollable'
                    >
                        <Tab label='Coaches' value='coaches' />
                        <Tab label='Upcoming Sessions' value='sessions' />
                    </Tabs>
                </Box>
                <TabPanel value='coaches'>
                    <CoachesTab />
                </TabPanel>
                <TabPanel value='sessions'>
                    <UpcomingSessions />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default CoachingPage;
