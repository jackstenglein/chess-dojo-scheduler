import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Container, Tab, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { AuthStatus, useAuth } from '../../../auth/Auth';
import { OpenClassical } from '../../../database/tournament';
import LoadingPage from '../../../loading/LoadingPage';
import BannedPlayersTab from './BannedPlayersTab';
import PlayersTab from './PlayersTab';

const AdminPage = () => {
    const auth = useAuth();
    const [tab, setTab] = useState('players');

    const api = useApi();
    const request = useRequest<OpenClassical>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getOpenClassical()
                .then((resp) => {
                    console.log('getOpenClassical: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, request]);

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (!auth.user?.isAdmin && !auth.user?.isTournamentAdmin) {
        return <Navigate to='/tournaments/open-classical' replace />;
    }

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 5 }}>
            <Typography variant='h4' mb={2}>
                Open Classical Admin
            </Typography>

            <RequestSnackbar request={request} />

            {request.data && (
                <TabContext value={tab}>
                    <TabList
                        onChange={(_, value) => setTab(value)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label='Active Players' value='players' />
                        <Tab label='Pairings' value='pairings' />
                        <Tab label='Banned Players' value='bannedPlayers' />
                    </TabList>
                    <TabPanel value='players'>
                        <PlayersTab
                            openClassical={request.data}
                            onUpdate={request.onSuccess}
                        />
                    </TabPanel>
                    <TabPanel value='pairings'>Pairings</TabPanel>
                    <TabPanel value='bannedPlayers'>
                        <BannedPlayersTab
                            openClassical={request.data}
                            onUpdate={request.onSuccess}
                        />
                    </TabPanel>
                </TabContext>
            )}
        </Container>
    );
};

export default AdminPage;
