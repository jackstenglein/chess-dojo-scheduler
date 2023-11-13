import { Box, CardContent, Stack, Tab, Tooltip, Typography } from '@mui/material';
import FunctionsIcon from '@mui/icons-material/Functions';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowModel,
    GridRowParams,
    GridValueGetterParams,
} from '@mui/x-data-grid-pro';
import { darken, lighten, styled } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { Event, EventType } from '@jackstenglein/chess';

import { useChess } from './PgnBoard';
import { usePosition } from '../../api/cache/positions';
import LoadingPage from '../../loading/LoadingPage';
import {
    ExplorerMove,
    ExplorerResult,
    getGameCount,
    getResultCount,
} from '../../database/explorer';
import { reconcile } from '../Board';

const getBackgroundColor = (color: string, mode: string) =>
    mode === 'dark' ? darken(color, 0.65) : lighten(color, 0.65);

const StyledDataGrid = styled(DataGridPro<ExplorerMove>)(({ theme }) => ({
    '& .chess-dojo-explorer--total': {
        backgroundColor: getBackgroundColor(theme.palette.info.main, theme.palette.mode),
    },
}));

const Explorer = () => {
    const [tab, setTab] = useState('dojo');

    return (
        <CardContent>
            <TabContext value={tab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        onChange={(_, val) => setTab(val)}
                        aria-label='Position database type'
                    >
                        <Tab label='Dojo Database' value='dojo' />
                        <Tab label='Lichess Database' value='lichess' />
                    </TabList>
                </Box>
                <TabPanel value='dojo' sx={{ px: 0 }}>
                    <DojoDatabase />
                </TabPanel>
                <TabPanel value='lichess' sx={{ px: 0 }}>
                    Coming Soon
                </TabPanel>
            </TabContext>
        </CardContent>
    );
};

const DojoDatabase = () => {
    const { chess, board } = useChess();
    const [fen, setFen] = useState(chess?.fen() || '');
    const { position, request } = usePosition(fen);

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

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setFen]);

    const sortedMoves = useMemo(
        () =>
            Object.values(position?.moves || [])
                .filter((move) => {
                    return Object.values(move.results).some(
                        (result) =>
                            result.white ||
                            result.black ||
                            result.draws ||
                            result.analysis
                    );
                })
                .sort((lhs, rhs) => {
                    const lhsCount = getGameCount(lhs.results);
                    const rhsCount = getGameCount(rhs.results);
                    if (lhsCount < rhsCount) {
                        return -1;
                    }
                    return 1;
                }),
        [position]
    );

    const pinnedRows = useMemo(() => {
        return {
            bottom: [
                {
                    san: 'Total',
                    results: position?.results || {},
                },
            ],
        };
    }, [position]);

    const totalGames = getGameCount(position?.results || {});

    const columns: GridColDef<ExplorerMove>[] = useMemo(() => {
        return [
            {
                field: 'san',
                headerName: 'Move',
                align: 'left',
                headerAlign: 'left',
                minWidth: 55,
                width: 55,
                renderCell: (params: GridRenderCellParams<ExplorerMove, string>) => {
                    if (params.value === 'Total') {
                        return <FunctionsIcon fontSize='small' />;
                    }
                    return params.value;
                },
            },
            {
                field: 'games',
                headerName: 'Games',
                align: 'left',
                headerAlign: 'left',
                valueGetter: (params: GridValueGetterParams<ExplorerMove>) =>
                    getGameCount(params.row.results),
                renderCell: (params: GridRenderCellParams<ExplorerMove, number>) => {
                    const gameCount = params.value || 0;
                    return (
                        <Stack direction='row' spacing={2}>
                            <div>{Math.round(100 * (gameCount / totalGames))}%</div>
                            <div>{gameCount}</div>
                        </Stack>
                    );
                },
                flex: 0.5,
            },
            {
                field: 'results',
                headerName: 'Results',
                align: 'right',
                headerAlign: 'left',
                valueGetter: (params: GridValueGetterParams<ExplorerMove>) =>
                    getResultCount(params.row, 'white'),
                renderCell: (params: GridRenderCellParams<ExplorerMove>) => (
                    <ResultGraph move={params.row} />
                ),
                flex: 1,
            },
        ];
    }, [totalGames]);

    if (!position && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    if (!position) {
        return <Typography>No games found</Typography>;
    }

    const onClickMove = (params: GridRowParams<ExplorerMove>) => {
        console.log('onClickMove: ', params);
        if (params.id !== 'Total') {
            chess?.move(params.id as string);
            reconcile(chess, board);
        }
    };

    return (
        <StyledDataGrid
            autoHeight
            disableColumnMenu
            disableColumnReorder
            hideFooter
            columns={columns}
            rows={sortedMoves}
            pinnedRows={pinnedRows}
            getRowId={(row: GridRowModel<ExplorerMove>) => row.san}
            isRowSelectable={(params) => params.id !== 'Total'}
            getRowClassName={(params) =>
                params.id === 'Total' ? 'chess-dojo-explorer--total' : ''
            }
            slots={{
                noRowsOverlay: () => (
                    <Stack
                        height={1}
                        width={1}
                        alignItems='center'
                        justifyContent='center'
                    >
                        No moves played from this position
                    </Stack>
                ),
            }}
            onRowClick={onClickMove}
        />
    );
};

const results: (keyof ExplorerResult)[] = ['white', 'draws', 'black', 'analysis'];

const resultGraphColors = {
    white: '#ccc',
    draws: '#666',
    black: '#333',
    analysis: '#42a5f5',
};

const resultGraphTextColors = {
    white: '#222',
    draws: '#ddd',
    black: '#fff',
    analysis: '#fff',
};

interface ResultGraphProps {
    move: ExplorerMove;
}

const ResultGraph: React.FC<ResultGraphProps> = ({ move }) => {
    const totalGames = getGameCount(move.results);

    return (
        <Stack
            direction='row'
            sx={{
                width: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: '3px',
                overflow: 'hidden',
            }}
        >
            {results.map((k) => {
                const count = getResultCount(move, k);
                const percentage = (100 * count) / totalGames;
                if (count === 0) {
                    return null;
                }

                return (
                    <Tooltip
                        key={k}
                        title={
                            <Box sx={{ textAlign: 'center' }}>
                                {k[0].toUpperCase()}
                                {k.substring(1)}
                                <br />
                                {count} Game{count !== 1 ? 's' : ''}
                                <br />
                                {Math.round(percentage * 10) / 10}%
                            </Box>
                        }
                    >
                        <Box
                            sx={{
                                width: `${percentage}%`,
                                backgroundColor: resultGraphColors[k],
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'end',
                                overflow: 'hidden',
                                height: '16px',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '0.9rem',
                                    lineHeight: '14px',
                                    color: resultGraphTextColors[k],
                                }}
                            >
                                {Math.round(percentage)}%
                            </Typography>
                        </Box>
                    </Tooltip>
                );
            })}
        </Stack>
    );
};

export default Explorer;
