'use client';

import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { TabContext, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs } from '@mui/material';
import CoachesTab from './CoachesTab';
import UpcomingSessions from './UpcomingSessions';

const CoachingPage = () => {
    const { searchParams, setSearchParams } = useNextSearchParams({ view: 'sessions' });

    return (
        <Container>
            <TabContext value={searchParams.get('view') || 'coaches'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={searchParams.get('view') || 'coaches'}
                        onChange={(_, t: string) => setSearchParams({ view: t })}
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
