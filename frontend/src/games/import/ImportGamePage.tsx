import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TabContext, TabPanel } from '@mui/lab';
import { Box, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CreateGameRequest, RemoteGame, isGame } from '../../api/gameApi';
import { OnlineGameForm } from './OnlineGameForm';
import { PGNForm } from './PGNForm';
import { PositionForm } from './PositionForm';

enum ImportSource {
    URL = 'url',
    Position = 'position',
    PGNText = 'pgn-text',
}

interface ImportTabPanelProps {
    children: React.ReactNode;
    source: ImportSource;
}

const ImportTabPanel: React.FC<ImportTabPanelProps> = ({ children, source }) => {
    return (
        <TabPanel value={source} sx={{ px: { xs: 0, sm: 3 } }}>
            {children}
        </TabPanel>
    );
};

const ImportGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();
    const [source, setSource] = useState<ImportSource>(ImportSource.URL);

    const loading = request.isLoading();

    const onImport = (remoteGame: RemoteGame) => {
        const req: CreateGameRequest = {
            ...remoteGame,
            orientation: 'white',
        };
        request.onStart();
        api.createGame(req)
            .then((response) => {
                console.log(response);
                if (isGame(response.data)) {
                    const game = response.data;
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        source: req.type,
                    });
                    navigate(
                        `../${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                            '?',
                            '%3F',
                        )}`,
                    );
                } else if (response.data.headers) {
                    request.onSuccess();
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        source: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    navigate('/profile?view=games');
                }
            })
            .catch((err) => {
                console.error('CreateGame ', err);
                request.onFailure(err);
            });
    };

    const handleTabChange = (_event: React.SyntheticEvent, source: ImportSource) => {
        setSource(source);
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <Container maxWidth='md' sx={{ py: 5 }}>
                <Stack spacing={2}>
                    <Typography variant='h6'>Import Game</Typography>
                    <Typography variant='body1'>
                        Specify a source of the game, study, or annotations you would like
                        to import. After importing, you can publish them to make them
                        public. Before then, you can still share a link to them so others
                        can view and comment.
                    </Typography>
                    <Box sx={{ typography: 'body1' }}>
                        <TabContext value={source}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    onChange={handleTabChange}
                                    value={source}
                                    aria-label='import sources tabs'
                                    variant='scrollable'
                                >
                                    <Tab
                                        value={ImportSource.URL}
                                        label={'Lichess & Chess.com'}
                                        data-cy={'import-url'}
                                    />
                                    <Tab
                                        value={ImportSource.Position}
                                        label='Position'
                                        data-cy={'import-position'}
                                    />
                                    <Tab
                                        value={ImportSource.PGNText}
                                        label='PGN'
                                        data-cy={'import-pgn-text'}
                                    />
                                </Tabs>
                            </Box>
                            <ImportTabPanel source={ImportSource.URL}>
                                <OnlineGameForm onSubmit={onImport} loading={loading} />
                            </ImportTabPanel>
                            <ImportTabPanel source={ImportSource.PGNText}>
                                <PGNForm onSubmit={onImport} loading={loading} />
                            </ImportTabPanel>
                            <ImportTabPanel source={ImportSource.Position}>
                                <PositionForm onSubmit={onImport} loading={loading} />
                            </ImportTabPanel>
                        </TabContext>
                    </Box>
                </Stack>
            </Container>
        </>
    );
};

export default ImportGamePage;
