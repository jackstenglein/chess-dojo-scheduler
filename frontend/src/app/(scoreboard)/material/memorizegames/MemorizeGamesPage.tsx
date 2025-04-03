'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import PgnSelector from '@/app/(scoreboard)/courses/[type]/[id]/[chapter]/[module]/PgnSelector';
import { useFreeTier } from '@/auth/Auth';
import {
    BoardApi,
    Chess,
    defaultOnMove as defaultOnMoveGenerator,
    PrimitiveMove,
    reconcile,
} from '@/board/Board';
import { ShowGlyphsKey } from '@/board/pgn/boardTools/underboard/settings/ViewerSettings';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard from '@/board/pgn/PgnBoard';
import { AfterPgnText } from '@/components/material/memorizegames/AfterPgnText';
import {
    correctMoveGlyphHtml,
    incorrectMoveGlyphHtml,
} from '@/components/material/memorizegames/moveGlyphs';
import { Game, GameInfo } from '@/database/game';
import { compareCohorts, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { Square } from '@jackstenglein/chess';
import { Info } from '@mui/icons-material';
import {
    CardContent,
    Container,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

interface WrongMove {
    from: Square;
    to: Square;
    promotion?: string | undefined;
}

export function MemorizeGamesPage({ user }: { user: User }) {
    const api = useApi();
    const listRequest = useRequest<GameInfo[]>();
    const getRequest = useRequest<Game>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState<'study' | 'test'>('study');
    const isFreeTier = useFreeTier();
    const [showGlyphs] = useLocalStorage(ShowGlyphsKey, false);
    const defaultOnMove = defaultOnMoveGenerator(showGlyphs);
    const solutionChess = useRef<Chess>();
    const incorrectMoves = useRef<WrongMove[]>([]);
    const [isComplete, setIsComplete] = useState(false);

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
                    solutionChess.current = new Chess({ pgn: res.data.pgn });
                    solutionChess.current.seek(null);
                    incorrectMoves.current = [];
                })
                .catch((err) => {
                    console.error('getGame: ', err);
                    getRequest.onFailure(err);
                });
        }
    }, [listRequest, getRequest, selectedIndex, api]);

    const onMove = useCallback(
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            if (
                mode === 'study' ||
                (chess.history().length && chess.currentMove() !== chess.history().at(-1)) ||
                solutionChess.current?.currentMove() === solutionChess.current?.history().at(-1)
            ) {
                defaultOnMove(board, chess, primMove);
                return;
            }

            const move = { from: primMove.orig, to: primMove.dest, promotion: primMove.promotion };
            if (solutionChess.current?.isMainline(move)) {
                solutionChess.current.move(move);
                const currentMove = chess.currentMove();
                const newMove = chess.move(move);
                for (const m of incorrectMoves.current) {
                    chess.move(m, { previousMove: currentMove });
                }
                incorrectMoves.current = [];

                chess.seek(newMove);
                reconcile(chess, board, showGlyphs);
                board.set({
                    drawable: {
                        autoShapes: [{ orig: move.to, customSvg: { html: correctMoveGlyphHtml } }],
                    },
                });
                setIsComplete(
                    solutionChess.current.currentMove() === solutionChess.current.history().at(-1),
                );
            } else {
                incorrectMoves.current.push(move);
                board.set({
                    movable: {},
                    premovable: {
                        enabled: false,
                    },
                    drawable: {
                        autoShapes: [
                            { orig: move.to, customSvg: { html: incorrectMoveGlyphHtml } },
                        ],
                        eraseOnClick: false,
                    },
                });
                setTimeout(() => {
                    reconcile(chess, board, showGlyphs);
                }, 500);
            }
        },
        [mode, defaultOnMove, showGlyphs],
    );

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

    const onSwitchMode = (newMode: 'study' | 'test') => {
        if (mode !== newMode) {
            setMode(newMode);
            solutionChess.current?.seek(null);
            incorrectMoves.current = [];
            setIsComplete(false);
        }
    };

    const onReset = () => {
        solutionChess.current?.seek(null);
        incorrectMoves.current = [];
        setIsComplete(false);
    };

    const games = isFreeTier ? listRequest.data.slice(0, 3) : listRequest.data;

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={listRequest} />
            <RequestSnackbar request={getRequest} />

            <PgnBoard
                pgn={
                    mode === 'study' ? getRequest.data?.pgn : getRequest.data?.pgn.split('\n\n')[0]
                }
                underboardTabs={[
                    {
                        name: 'gameList',
                        tooltip: 'Games',
                        icon: <Info />,
                        element: (
                            <CardContent>
                                <FormControl sx={{ mb: 1 }}>
                                    <RadioGroup
                                        row
                                        value={mode}
                                        onChange={(e) => {
                                            onSwitchMode(e.target.value as 'study' | 'test');
                                            e.target.blur();
                                        }}
                                    >
                                        <FormControlLabel
                                            value='study'
                                            control={<Radio />}
                                            label='Study'
                                        />
                                        <FormControlLabel
                                            value='test'
                                            control={<Radio />}
                                            label='Test'
                                        />
                                    </RadioGroup>
                                </FormControl>

                                <PgnSelector
                                    headers={games.map((g) => g.headers)}
                                    selectedIndex={selectedIndex}
                                    setSelectedIndex={onSwitchGame}
                                    hiddenCount={
                                        isFreeTier ? listRequest.data.length - games.length : 0
                                    }
                                    noCard
                                />
                            </CardContent>
                        ),
                    },
                    DefaultUnderboardTab.Explorer,
                    DefaultUnderboardTab.Share,
                    DefaultUnderboardTab.Settings,
                ]}
                initialUnderboardTab='gameList'
                disableEngine={mode === 'test'}
                disableNullMoves={mode === 'test'}
                slotProps={{
                    pgnText: {
                        hideResult: mode === 'test',
                    },
                    board: {
                        onMove,
                    },
                }}
                slots={{
                    afterPgnText:
                        mode === 'test' ? (
                            <AfterPgnText
                                solution={solutionChess}
                                isComplete={isComplete}
                                onReset={onReset}
                            />
                        ) : undefined,
                }}
            />
        </Container>
    );
}
