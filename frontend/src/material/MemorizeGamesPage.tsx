import {
    Box,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    Link,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import PgnSelector from '../app/(scoreboard)/courses/[type]/[id]/PgnSelector';
import { useFreeTier, useRequiredAuth } from '../auth/Auth';
import PgnBoard from '../board/pgn/PgnBoard';
import PuzzleBoard from '../board/puzzle/PuzzleBoard';
import { coachUrls, coaches } from '../database/course';
import { Game, GameInfo } from '../database/game';
import { compareCohorts } from '../database/user';
import PgnErrorBoundary from '../games/view/PgnErrorBoundary';
import LoadingPage from '../loading/LoadingPage';

const MemorizeGamesPage = () => {
    const { user } = useRequiredAuth();
    const api = useApi();
    const listRequest = useRequest<GameInfo[]>();
    const getRequest = useRequest<Game>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState('study');
    const isFreeTier = useFreeTier();

    useEffect(() => {
        if (!listRequest.isSent()) {
            listRequest.onStart();

            api.listGamesByOwner('games_to_memorize')
                .then((res) => {
                    const games = res.data.games.sort((lhs, rhs) =>
                        compareCohorts(lhs.cohort, rhs.cohort),
                    );
                    listRequest.onSuccess(games);
                    const i = games.findIndex((g) => g.cohort === user.dojoCohort);
                    if (i >= 0) {
                        setSelectedIndex(i);
                    }
                })
                .catch((err) => {
                    console.error('listGamesToMemorize: ', err);
                    listRequest.onFailure(err);
                });
        }
    }, [listRequest, api, user.dojoCohort]);

    useEffect(() => {
        const gameInfo = listRequest.data?.[selectedIndex];
        if (!getRequest.isSent() && gameInfo) {
            getRequest.onStart();
            api.getGame(gameInfo.cohort, gameInfo.id)
                .then((res) => {
                    getRequest.onSuccess(res.data);
                })
                .catch((err) => {
                    console.error('getGame: ', err);
                    getRequest.onFailure(err);
                });
        }
    }, [listRequest, getRequest, selectedIndex, api]);

    if (listRequest.isLoading() || !listRequest.isSent()) {
        return <LoadingPage />;
    }

    if (!listRequest.data || listRequest.data.length === 0) {
        return <Typography>No games found</Typography>;
    }

    const onSwitchGame = (idx: number) => {
        if (idx !== selectedIndex) {
            setSelectedIndex(idx);
            getRequest.reset();
        }
    };

    const games = isFreeTier ? listRequest.data.slice(0, 3) : listRequest.data;

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 10 }}>
            {!isFreeTier && (
                <Typography sx={{ mb: 4 }}>
                    Games to memorize are also available in this{' '}
                    <Link
                        href='https://lichess.org/study/u9qJoSlL'
                        target='_blank'
                        rel='noreferrer'
                    >
                        Lichess study
                    </Link>
                    .
                </Typography>
            )}

            <FormControl>
                <FormLabel>Mode</FormLabel>
                <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)}>
                    <FormControlLabel value='study' control={<Radio />} label='Study' />
                    <FormControlLabel value='test' control={<Radio />} label='Test' />
                </RadioGroup>
            </FormControl>

            <Container
                maxWidth={false}
                sx={{
                    pt: 1,
                    pb: 4,
                    px: '0 !important',
                    '--gap': '16px',
                    '--site-header-height': '80px',
                    '--site-header-margin': '150px',
                    '--player-header-height': '28px',
                    '--underboard-width': '400px',
                    '--coach-width': '400px',
                    '--tools-height': '40px',
                    '--board-width':
                        'calc(100vw - var(--coach-width) - var(--coach-width) - 60px)',
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
                            xs: 'minmax(0, 18em) auto',
                            xl: 'calc(var(--board-size) + 2 * var(--player-header-height) + var(--tools-height))',
                        },
                        gridTemplateColumns: {
                            xs: '1fr',
                            xl: 'var(--coach-width) var(--gap) 1fr',
                        },
                        gridTemplateAreas: {
                            xs: '"extras" "pgn"',
                            xl: '"extras . pgn"',
                        },
                    }}
                >
                    <Stack gridArea='extras' height={1} alignItems='center'>
                        <PgnSelector
                            headers={games.map((g) => g.headers)}
                            selectedIndex={selectedIndex}
                            setSelectedIndex={onSwitchGame}
                            fullHeight
                            hiddenCount={
                                isFreeTier ? listRequest.data.length - games.length : 0
                            }
                        />
                    </Stack>

                    {getRequest.isLoading() && (
                        <Box sx={{ gridArea: 'pgn' }}>
                            <LoadingPage />
                        </Box>
                    )}

                    {getRequest.data && (
                        <PgnErrorBoundary pgn={getRequest.data.pgn}>
                            {mode === 'study' && (
                                <PgnBoard
                                    key={getRequest.data.pgn}
                                    pgn={getRequest.data.pgn}
                                    startOrientation={getRequest.data.orientation}
                                    underboardTabs={[]}
                                />
                            )}

                            {mode === 'test' && (
                                <PuzzleBoard
                                    key={getRequest.data.pgn}
                                    pgn={getRequest.data.pgn}
                                    hideHeader
                                    playBothSides
                                    sx={{
                                        gridArea: 'pgn',
                                        display: 'grid',
                                        width: 1,
                                        gridTemplateRows: {
                                            xs: 'auto auto auto auto var(--gap) minmax(auto, 400px)',
                                            md: 'var(--player-header-height) var(--board-size) var(--player-header-height) auto',
                                        },
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: 'var(--board-size) var(--gap) var(--coach-width)',
                                        },
                                        gridTemplateAreas: {
                                            xs: `"playerheader"
                                             "board"
                                             "playerfooter"
                                             "boardButtons"
                                             "."
                                             "coach"`,

                                            md: `"playerheader . coach"
                                             "board . coach"
                                             "playerfooter . coach"
                                             "boardButtons . ."`,
                                        },
                                    }}
                                    onComplete={() => null}
                                    coachUrl={
                                        coachUrls[coaches[selectedIndex % coaches.length]]
                                    }
                                />
                            )}
                        </PgnErrorBoundary>
                    )}
                </Box>

                <RequestSnackbar request={listRequest} />
                <RequestSnackbar request={getRequest} />
            </Container>
        </Container>
    );
};

export default MemorizeGamesPage;
