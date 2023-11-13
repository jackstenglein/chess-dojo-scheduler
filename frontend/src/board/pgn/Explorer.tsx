import {
    Box,
    CardContent,
    Link,
    MenuItem,
    Stack,
    Tab,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
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
import { Link as RouterLink } from 'react-router-dom';

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
import { dojoCohorts, getCohortRange } from '../../database/user';

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
    const [minCohort, setMinCohort] = useState('');
    const [maxCohort, setMaxCohort] = useState('');

    const cohortRange = useMemo(
        () => getCohortRange(minCohort, maxCohort),
        [minCohort, maxCohort]
    );

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
                    return cohortRange.some((cohort) => {
                        const result = move.results[cohort] || {};
                        return (
                            result.white ||
                            result.black ||
                            result.draws ||
                            result.analysis
                        );
                    });
                })
                .sort((lhs, rhs) => {
                    const lhsCount = getGameCount(lhs.results, cohortRange);
                    const rhsCount = getGameCount(rhs.results, cohortRange);
                    if (lhsCount < rhsCount) {
                        return -1;
                    }
                    return 1;
                }),
        [position, cohortRange]
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

    const totalGames = getGameCount(position?.results || {}, cohortRange);

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
                    getGameCount(params.row.results, cohortRange),
                renderCell: (params: GridRenderCellParams<ExplorerMove, number>) => {
                    const gameCount = params.value || 0;
                    return (
                        <Stack direction='row' spacing={2}>
                            <div>
                                {totalGames === 0
                                    ? 0
                                    : Math.round(100 * (gameCount / totalGames))}
                                %
                            </div>
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
                    getResultCount(params.row, 'white', cohortRange),
                renderCell: (params: GridRenderCellParams<ExplorerMove>) => (
                    <ResultGraph move={params.row} cohortRange={cohortRange} />
                ),
                flex: 1,
            },
        ];
    }, [totalGames, cohortRange]);

    if (!position && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    if (!position) {
        return (
            <Stack width={1} alignItems='center'>
                <Typography>No games found in this position</Typography>
            </Stack>
        );
    }

    const onClickMove = (params: GridRowParams<ExplorerMove>) => {
        console.log('onClickMove: ', params);
        if (params.id !== 'Total') {
            chess?.move(params.id as string);
            reconcile(chess, board);
        }
    };

    return (
        <Grid container columnSpacing={1} rowSpacing={2}>
            <Grid xs={6} sm={6}>
                <TextField
                    select
                    fullWidth
                    label='Min Cohort'
                    value={minCohort}
                    onChange={(e) => setMinCohort(e.target.value)}
                >
                    {dojoCohorts.map((cohort) => (
                        <MenuItem key={cohort} value={cohort}>
                            {cohort}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>
            <Grid xs={6} sm={6}>
                <TextField
                    select
                    fullWidth
                    label='Max Cohort'
                    value={maxCohort}
                    onChange={(e) => setMaxCohort(e.target.value)}
                >
                    {dojoCohorts.map((cohort) => (
                        <MenuItem key={cohort} value={cohort}>
                            {cohort}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid xs={12}>
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
                                <Typography>
                                    No moves played from this position.
                                </Typography>
                                {cohortRange.length < dojoCohorts.length && (
                                    <Typography>
                                        Try expanding your cohort range.
                                    </Typography>
                                )}
                            </Stack>
                        ),
                    }}
                    onRowClick={onClickMove}
                />
            </Grid>

            <Grid xs={12} display='flex' justifyContent='center'>
                <Link component={RouterLink} to='/games' target='_blank' rel='noopener'>
                    View all games containing this position
                </Link>
            </Grid>
        </Grid>
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
    cohortRange: string[];
}

const ResultGraph: React.FC<ResultGraphProps> = ({ move, cohortRange }) => {
    const totalGames = getGameCount(move.results, cohortRange);
    if (totalGames === 0) {
        return null;
    }

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
                const count = getResultCount(move, k, cohortRange);
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
