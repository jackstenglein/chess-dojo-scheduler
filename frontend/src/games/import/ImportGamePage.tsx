import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TabContext, TabPanel } from '@mui/lab';
import {
    Box,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import {
    BoardOrientation,
    CreateGameRequest,
    GameHeader,
    RemoteGame,
    isGame,
} from '../../api/gameApi';
import { OnlineGameForm } from './OnlineGameForm';
import { PGNForm } from './PGNForm';
import { StartingPositionForm } from './StartingPositionForm';

enum ImportSource {
    URL = 'url',
    StartingPosition = 'starting-position',
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

interface Preflight {
    req: CreateGameRequest;
    headers: GameHeader[];
    function: 'create' | 'edit';
}

const ImportGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();
    const [source, setSource] = useState<ImportSource>(ImportSource.URL);
    const [orientation, setOrientation] = useState<BoardOrientation>('white');

    const [preflight, setPreflight] = useState<Preflight>();

    const loading = request.isLoading();

    const onImport = (remoteGame: RemoteGame) => {
        const req = {
            ...remoteGame,
            orientation,
        };
        console.log(req);

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
                    setPreflight({
                        function: 'create',
                        req,
                        headers: response.data.headers,
                    });
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        source: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    //navigate('/profile?view=games');
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
                        <Stack>
                            <FormControl sx={{ pt: 1, pb: 3 }}>
                                <FormLabel>Board Orientation</FormLabel>
                                <RadioGroup
                                    row
                                    value={orientation}
                                    onChange={(_, v) =>
                                        setOrientation(v as BoardOrientation)
                                    }
                                >
                                    <FormControlLabel
                                        value='white'
                                        control={<Radio />}
                                        label='White'
                                    />
                                    <FormControlLabel
                                        value='black'
                                        control={<Radio />}
                                        label='Black'
                                    />
                                </RadioGroup>
                            </FormControl>

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
                                        />
                                        <Tab value={ImportSource.PGNText} label='PGN' />
                                        <Tab
                                            value={ImportSource.StartingPosition}
                                            label='Starting Position'
                                        />
                                    </Tabs>
                                </Box>
                                <ImportTabPanel source={ImportSource.URL}>
                                    <OnlineGameForm
                                        onSubmit={onImport}
                                        loading={loading}
                                    />
                                </ImportTabPanel>
                                <ImportTabPanel source={ImportSource.PGNText}>
                                    <PGNForm onSubmit={onImport} loading={loading} />
                                </ImportTabPanel>
                                <ImportTabPanel source={ImportSource.StartingPosition}>
                                    <StartingPositionForm
                                        onSubmit={onImport}
                                        loading={loading}
                                    />
                                </ImportTabPanel>
                            </TabContext>
                        </Stack>
                    </Box>
                </Stack>
            </Container>
        </>
    );
};

export default ImportGamePage;
