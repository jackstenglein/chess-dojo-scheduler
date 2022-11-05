import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/Auth';
import AvailabilitiesTab from './AvailabilitiesTab';
import MeetingsTab from './MeetingsTab';
import UsersTab from './UsersTab';

const AdminPage = () => {
    const [tab, setTab] = useState('users');

    const user = useAuth().user;
    if (!user || !user.isAdmin) {
        return <Navigate to='/calendar' replace />;
    }

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <Typography variant='h4' sx={{ mb: 4 }}>
                Admin Portal
            </Typography>

            <Box sx={{ width: '100%', typography: 'body1' }}>
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={(_, t) => setTab(t)} aria-label='admin tabs'>
                            <Tab label='Users' value='users' />
                            <Tab label='Availabilities' value='availabilities' />
                            <Tab label='Meetings' value='meetings' />
                        </TabList>
                    </Box>
                    <TabPanel value='users'>
                        <UsersTab />
                    </TabPanel>
                    <TabPanel value='availabilities'>
                        <AvailabilitiesTab />
                    </TabPanel>
                    <TabPanel value='meetings'>
                        <MeetingsTab />
                    </TabPanel>
                </TabContext>
            </Box>
        </Container>
    );
};

export default AdminPage;
