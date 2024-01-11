import { TabContext, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import CoachingCalendar from './CoachingCalendar';

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
                        <Tab label='List' value='list' />
                        <Tab label='Calendar' value='calendar' />
                    </Tabs>
                </Box>
                <TabPanel value='coaches'>Item One</TabPanel>
                <TabPanel value='list'>Item Two</TabPanel>
                <TabPanel value='calendar' sx={{ px: 0 }}>
                    <CoachingCalendar />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default CoachingPage;
