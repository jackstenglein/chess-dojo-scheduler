import { Event, EventType } from '@jackstenglein/chess';
import { TabContext, TabList } from '@mui/lab';
import { Box, CardContent, Tab } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { usePosition } from '../../../api/cache/positions';
import { ExplorerPositionFollower } from '../../../database/explorer';
import { useChess } from '../PgnBoard';
import Database from './Database';
import Header from './Header';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const Explorer = () => {
    const [tab, setTab] = useState<'dojo' | 'lichess'>('dojo');
    const { chess } = useChess();
    const [fen, setFen] = useState(chess?.fen() || startingPositionFen);
    const { position, request, putPosition } = usePosition(fen);
    const [minCohort, setMinCohort] = useState('');
    const [maxCohort, setMaxCohort] = useState('');

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.Initialized, EventType.LegalMove],
                handler: (event: Event) => {
                    console.log('Chess Event: ', event);
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
                    lichess: null,
                });
            }
        },
        [putPosition, position],
    );

    const { dojo, lichess, follower } = position || {};

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
                    <TabList
                        onChange={(_, val: 'dojo' | 'lichess') => setTab(val)}
                        aria-label='Position database type'
                    >
                        <Tab label='Dojo Database' value='dojo' />
                        <Tab label='Lichess Database' value='lichess' />
                    </TabList>
                </Box>

                <Database
                    type={tab}
                    fen={fen}
                    position={tab === 'dojo' ? dojo : lichess}
                    request={request}
                    minCohort={minCohort}
                    maxCohort={maxCohort}
                    setMinCohort={setMinCohort}
                    setMaxCohort={setMaxCohort}
                />
            </TabContext>
        </CardContent>
    );
};

export default Explorer;
