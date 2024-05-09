import { Search } from '@mui/icons-material';
import { Box, CardContent, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import PgnBoard from '../board/pgn/PgnBoard';
import PgnSelector from '../courses/view/PgnSelector';
import { Game, GameInfo } from '../database/game';
import { compareCohorts, dojoCohorts } from '../database/user';
import PgnErrorBoundary from '../games/view/PgnErrorBoundary';
import LoadingPage from '../loading/LoadingPage';
import CohortIcon from '../scoreboard/CohortIcon';
const ModelGamesPage = () => {
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
                            compareCohorts(lhs.cohort, rhs.cohort),
                        ),
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
        <Box sx={{ py: 4, px: 0 }}>
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
                        underboardTabs={[
                            {
                                name: 'selector',
                                tooltip: 'Select Game',
                                icon: <Search />,
                                element: (
                                    <CardContent data-cy='pgn-selector'>
                                        <TextField
                                            data-cy='cohort-select'
                                            select
                                            label='Cohort'
                                            value={cohort}
                                            onChange={(event) =>
                                                onChangeCohort(event.target.value)
                                            }
                                            sx={{ mb: 3 }}
                                            fullWidth
                                        >
                                            {dojoCohorts.map((option) => (
                                                <MenuItem key={option} value={option}>
                                                    <CohortIcon
                                                        cohort={option}
                                                        size={40}
                                                        sx={{ marginRight: '0.6rem', verticalAlign: 'middle'}}
                                                        tooltip=''
                                                        color='primary'
                                                    />
                                                    {option}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        {gameInfos.length ? (
                                            <PgnSelector
                                                headers={gameInfos.map((g) => g.headers)}
                                                selectedIndex={selectedIndex}
                                                setSelectedIndex={onSwitchGame}
                                                noCard
                                            />
                                        ) : (
                                            <Typography>
                                                No games found for cohort {cohort}
                                            </Typography>
                                        )}
                                    </CardContent>
                                ),
                            },
                        ]}
                        initialUnderboardTab='selector'
                    />
                </PgnErrorBoundary>
            )}

            <RequestSnackbar request={listRequest} />
            <RequestSnackbar request={getRequest} />
        </Box>
    );
};

export default ModelGamesPage;
