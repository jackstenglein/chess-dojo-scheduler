import { useEffect, useMemo, useState } from 'react';
import { Box, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import PgnSelector from './openings/PgnSelector';
import { Game, GameInfo } from '../database/game';
import LoadingPage from '../loading/LoadingPage';
import { compareCohorts, dojoCohorts } from '../database/user';
import PgnErrorBoundary from '../games/view/PgnErrorBoundary';
import PgnBoard from '../board/pgn/PgnBoard';
import { useAuth } from '../auth/Auth';

const ModelGamesTab = () => {
    const user = useAuth().user!;
    const api = useApi();
    const listRequest = useRequest<GameInfo[]>();
    const getRequest = useRequest<Game>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cohort, setCohort] = useState(user.dojoCohort);

    useEffect(() => {
        if (!listRequest.isSent()) {
            listRequest.onStart();

            api.listGamesByOwner('model_games')
                .then((res) => {
                    console.log('listModelGames: ', res);
                    listRequest.onSuccess(
                        res.data.games.sort((lhs, rhs) =>
                            compareCohorts(lhs.cohort, rhs.cohort)
                        )
                    );
                })
                .catch((err) => {
                    console.error('listModelGames: ', err);
                    listRequest.onFailure(err);
                });
        }
    }, [listRequest, api]);

    const gameInfos = useMemo(() => {
        return listRequest.data?.filter((g) => g.cohort === cohort) || [];
    }, [listRequest, cohort]);

    useEffect(() => {
        if (!getRequest.isSent() && gameInfos.length > 0) {
            const gameInfo = gameInfos[selectedIndex];

            getRequest.onStart();
            api.getGame(gameInfo.cohort, gameInfo.id)
                .then((res) => {
                    console.log('getGame: ', res);
                    getRequest.onSuccess(res.data);
                })
                .catch((err) => {
                    console.error('getGame: ', err);
                    getRequest.onFailure(err);
                });
        }
    }, [listRequest, getRequest, selectedIndex, api, gameInfos]);

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
        setSelectedIndex(0);
        getRequest.reset();
    };

    const onSwitchGame = (idx: number) => {
        if (idx !== selectedIndex) {
            setSelectedIndex(idx);
            getRequest.reset();
        }
    };

    if (listRequest.isLoading() || !listRequest.isSent()) {
        return <LoadingPage />;
    }

    return (
        <Stack>
            <Container
                maxWidth={false}
                sx={{
                    pt: 4,
                    pb: 4,
                    px: '0 !important',
                    '--gap': '16px',
                    '--site-header-height': '80px',
                    '--site-header-margin': '150px',
                    '--player-header-height': '28px',
                    '--toc-width': '21vw',
                    '--coach-width': '400px',
                    '--tools-height': '40px',
                    '--board-width':
                        'calc(100vw - var(--coach-width) - 60px - var(--toc-width))',
                    '--board-height':
                        'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 2 * var(--player-header-height))',
                    '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        rowGap: '16px',
                        gridTemplateRows: {
                            xs: 'calc(min(auto, 18em)) auto',
                        },
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'var(--board-size) var(--gap) var(--coach-width) auto',
                            xl: 'var(--coach-width) var(--gap) var(--board-size) var(--gap) var(--coach-width) auto',
                        },
                        gridTemplateAreas: {
                            xs: '"extras" "pgn"',
                            md: '"extras extras extras ." "pgn pgn pgn ."',
                            xl: '"extras . pgn pgn pgn ."',
                        },
                    }}
                >
                    <Stack gridArea='extras' height={1} alignItems='center'>
                        <TextField
                            select
                            label='Cohort'
                            value={cohort}
                            onChange={(event) => onChangeCohort(event.target.value)}
                            sx={{ mb: 3 }}
                            fullWidth
                        >
                            {dojoCohorts.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>

                        {gameInfos.length ? (
                            <PgnSelector
                                headers={gameInfos.map((g) => g.headers)}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={onSwitchGame}
                                fullHeight
                            />
                        ) : (
                            <Typography>No games found for cohort {cohort}</Typography>
                        )}
                    </Stack>

                    {getRequest.isLoading() && (
                        <Box sx={{ gridArea: 'pgn' }}>
                            <LoadingPage />
                        </Box>
                    )}

                    {getRequest.data && (
                        <PgnErrorBoundary pgn={getRequest.data.pgn}>
                            <PgnBoard
                                key={getRequest.data.pgn}
                                pgn={getRequest.data.pgn}
                                startOrientation={getRequest.data.orientation}
                                sx={{
                                    gridArea: 'pgn',
                                    display: 'grid',
                                    width: 1,
                                    gridTemplateRows: {
                                        xs: 'auto var(--gap) minmax(auto, 400px)',
                                        md: 'calc(var(--board-size) + var(--tools-height) + 8px + 2 * var(--player-header-height))',
                                    },
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        md: 'var(--board-size) var(--gap) var(--coach-width)',
                                    },
                                    gridTemplateAreas: {
                                        xs: '"board" "." "coach"',
                                        md: '"board . coach"',
                                    },
                                }}
                            />
                        </PgnErrorBoundary>
                    )}
                </Box>

                <RequestSnackbar request={listRequest} />
                <RequestSnackbar request={getRequest} />
            </Container>
        </Stack>
    );
};

export default ModelGamesTab;
