import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import CalendarTab from './CalendarTab';
import InfoTab from './InfoTab';
import LeaderboardTab from './LeaderboardTab';

const TabPanel: React.FC<{
    children?: React.ReactNode;
    index: number;
    value: number;
}> = ({ children, value, index }) => {
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const TournamentsPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant='fullWidth'
                    aria-label='Dojoliga viewer tabs'
                >
                    <Tab label='Info' icon={<InfoIcon />} />
                    <Tab label='Leaderboard' icon={<LeaderboardIcon />} />
                    <Tab label='Calendar' icon={<CalendarTodayIcon />} />
                </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
                <InfoTab />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
                <LeaderboardTab />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
                <CalendarTab />
            </TabPanel>
        </Container>
    );
};

export default TournamentsPage;
