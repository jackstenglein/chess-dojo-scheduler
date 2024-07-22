import { Event, EventType } from '@jackstenglein/chess';
import { TabContext } from '@mui/lab';
import { Box, CardContent, Tab, Tabs } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { SiLichess } from 'react-icons/si';
import { usePosition } from '../../../api/cache/positions';
import { ExplorerPositionFollower } from '../../../database/explorer';
import { ChessDojoIcon } from '../../../style/ChessDojoIcon';
import { KingIcon, RookIcon } from '../../../style/ChessIcons';
import { useChess } from '../PgnBoard';
import Database from './Database';
import Header from './Header';
import { Tablebase } from './Tablebase';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const defaultTimeControls = ['standard', 'rapid', 'blitz', 'unknown'];

export enum ExplorerDatabaseType {
    Dojo = 'dojo',
    Masters = 'masters',
    Lichess = 'lichess',
    Tablebase = 'tablebase',
}

const Explorer = () => {
    const [tab, setTab] = useState<ExplorerDatabaseType>(ExplorerDatabaseType.Dojo);
    const { chess } = useChess();
    const [fen, setFen] = useState(chess?.fen() || startingPositionFen);
    const { position, request, putPosition } = usePosition(fen);
    const [minCohort, setMinCohort] = useState('');
    const [maxCohort, setMaxCohort] = useState('');
    const [timeControls, setTimeControls] = useState(defaultTimeControls);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.Initialized, EventType.LegalMove],
                handler: (event: Event) => {
                    if (event.type === EventType.Initialized) {
                        setFen(chess.fen());
                    } else {
                        setFen(event.move?.after || chess.setUpFen());
                    }
                },
            };

            setFen(chess.fen());
            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setFen]);

    const setFollower = useCallback(
        (f: ExplorerPositionFollower | null) => {
            if (position) {
                putPosition({ ...position, follower: f });
            } else if (f) {
                putPosition({
                    follower: f,
                    normalizedFen: f.normalizedFen,
                    dojo: null,
                    masters: null,
                    lichess: null,
                    tablebase: null,
                });
            }
        },
        [putPosition, position],
    );

    const onSetTimeControls = (v: string[]) => {
        setTimeControls(
            v.sort(
                (lhs, rhs) =>
                    defaultTimeControls.indexOf(lhs) - defaultTimeControls.indexOf(rhs),
            ),
        );
    };

    const { dojo, masters, lichess, tablebase, follower } = position || {};

    const selectedPosition =
        tab === ExplorerDatabaseType.Dojo
            ? dojo
            : tab === ExplorerDatabaseType.Masters
              ? masters
              : lichess;

    return (
        <CardContent>
            <Header
                fen={fen}
                follower={follower}
                minCohort={minCohort}
                maxCohort={maxCohort}
                setFollower={setFollower}
            />

            <TabContext value={tab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tab}
                        onChange={(_, val: ExplorerDatabaseType) => setTab(val)}
                        aria-label='Position database type'
                        variant='scrollable'
                    >
                        <Tab
                            label='Dojo'
                            value={ExplorerDatabaseType.Dojo}
                            icon={<ChessDojoIcon />}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                        />
                        <Tab
                            label='Masters'
                            value={ExplorerDatabaseType.Masters}
                            icon={<KingIcon sx={{ fontSize: '1rem' }} />}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                        />
                        <Tab
                            label='Lichess'
                            value={ExplorerDatabaseType.Lichess}
                            icon={<SiLichess />}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                        />
                        <Tab
                            label='Tablebase'
                            value={ExplorerDatabaseType.Tablebase}
                            icon={<RookIcon sx={{ fontSize: '1rem' }} />}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                        />
                    </Tabs>
                </Box>

                {tab === ExplorerDatabaseType.Tablebase ? (
                    <Tablebase fen={fen} position={tablebase} request={request} />
                ) : (
                    <Database
                        type={tab}
                        fen={fen}
                        position={selectedPosition}
                        request={request}
                        minCohort={minCohort}
                        maxCohort={maxCohort}
                        setMinCohort={setMinCohort}
                        setMaxCohort={setMaxCohort}
                        timeControls={timeControls}
                        setTimeControls={onSetTimeControls}
                    />
                )}
            </TabContext>
        </CardContent>
    );
};

export default Explorer;
