'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import PgnSelector from '@/app/(scoreboard)/courses/[type]/[id]/[chapter]/[module]/PgnSelector';
import { useFreeTier } from '@/auth/Auth';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard, { PgnBoardMode } from '@/board/pgn/PgnBoard';
import { Game, GameInfo } from '@/database/game';
import { compareCohorts, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
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
import { useEffect, useState } from 'react';

export function MemorizeGamesPage({ user }: { user: User }) {
    const api = useApi();
    const listRequest = useRequest<GameInfo[]>();
    const getRequest = useRequest<Game>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState<'study' | 'test'>('study');
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

    const onSwitchMode = (newMode: 'study' | 'test') => {
        if (mode !== newMode) {
            setMode(newMode);
        }
    };

    const games = isFreeTier ? listRequest.data.slice(0, 3) : listRequest.data;

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={listRequest} />
            <RequestSnackbar request={getRequest} />

            <PgnBoard
                mode={mode === 'study' ? undefined : PgnBoardMode.Solitaire}
                pgn={getRequest.data?.pgn}
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
                }}
            />
        </Container>
    );
}
