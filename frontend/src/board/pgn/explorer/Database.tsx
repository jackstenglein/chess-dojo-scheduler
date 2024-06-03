import FunctionsIcon from '@mui/icons-material/Functions';
import {
    Box,
    Link,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
    darken,
    lighten,
    styled,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowModel,
    GridRowParams,
    GridValueGetterParams,
} from '@mui/x-data-grid-pro';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { Request } from '../../../api/Request';
import { useFreeTier } from '../../../auth/Auth';
import {
    ExplorerMove,
    ExplorerPosition,
    ExplorerResult,
    LichessExplorerMove,
    LichessExplorerPosition,
    getGameCount,
    getResultCount,
    isExplorerMove,
    isExplorerPosition,
} from '../../../database/explorer';
import { dojoCohorts, getCohortRange } from '../../../database/user';
import LoadingPage from '../../../loading/LoadingPage';
import UpsellAlert from '../../../upsell/UpsellAlert';
import { useReconcile } from '../../Board';
import { useChess } from '../PgnBoard';

const getBackgroundColor = (color: string, mode: string) =>
    mode === 'dark' ? darken(color, 0.65) : lighten(color, 0.65);

const StyledDataGrid = styled(DataGridPro<ExplorerMove | LichessExplorerMove>)(
    ({ theme }) => ({
        '& .chess-dojo-explorer--total': {
            backgroundColor: getBackgroundColor(
                theme.palette.info.main,
                theme.palette.mode,
            ),
        },
    }),
);

interface DatabaseProps {
    type: 'dojo' | 'lichess';
    fen: string;
    position: ExplorerPosition | LichessExplorerPosition | null | undefined;
    request: Request;
    minCohort: string;
    maxCohort: string;
    setMinCohort: (v: string) => void;
    setMaxCohort: (v: string) => void;
}

const Database: React.FC<DatabaseProps> = ({
    type,
    fen,
    position,
    request,
    minCohort,
    maxCohort,
    setMinCohort,
    setMaxCohort,
}) => {
    const { chess } = useChess();
    const reconcile = useReconcile();
    const isFreeTier = useFreeTier();

    const cohortRange = useMemo(
        () => getCohortRange(minCohort, maxCohort),
        [minCohort, maxCohort],
    );

    const sortedMoves: Array<ExplorerMove | LichessExplorerMove> = useMemo(() => {
        if (!isExplorerPosition(position)) {
            return position?.moves || [];
        }
        return Object.values(position?.moves || [])
            .filter((move) => {
                return cohortRange.some((cohort) => {
                    const result = move.results[cohort] || {};
                    return (
                        result.white || result.black || result.draws || result.analysis
                    );
                });
            })
            .sort((lhs, rhs) => {
                const lhsCount = getGameCount(lhs.results, cohortRange);
                const rhsCount = getGameCount(rhs.results, cohortRange);
                if (lhsCount < rhsCount) {
                    return 1;
                }
                return -1;
            });
    }, [position, cohortRange]);

    const pinnedRows = useMemo(() => {
        if (isExplorerPosition(position)) {
            return {
                bottom: [
                    {
                        san: 'Total',
                        results: position.results || {},
                    },
                ],
            };
        }
        return {
            bottom: [
                {
                    san: 'Total',
                    white: position?.white || 0,
                    black: position?.black || 0,
                    draws: position?.draws || 0,
                },
            ],
        };
    }, [position]);

    const totalGames = isExplorerPosition(position)
        ? getGameCount(position?.results || {}, cohortRange)
        : position
          ? position.white + position.black + position.draws
          : 0;

    const columns: GridColDef<ExplorerMove | LichessExplorerMove>[] = useMemo(() => {
        return [
            {
                field: 'san',
                headerName: 'Move',
                align: 'left',
                headerAlign: 'left',
                minWidth: 55,
                width: 55,
                renderCell: (
                    params: GridRenderCellParams<
                        ExplorerMove | LichessExplorerMove,
                        string
                    >,
                ) => {
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
                valueGetter: (
                    params: GridValueGetterParams<ExplorerMove | LichessExplorerMove>,
                ) => {
                    if (isExplorerMove(params.row)) {
                        return getGameCount(params.row.results, cohortRange);
                    }
                    return params.row.white + params.row.black + params.row.draws;
                },
                renderCell: (
                    params: GridRenderCellParams<
                        ExplorerMove | LichessExplorerMove,
                        number
                    >,
                ) => {
                    const gameCount = params.value || 0;
                    return (
                        <Stack direction='row' spacing={2}>
                            <div>
                                {totalGames === 0
                                    ? 0
                                    : Math.round(100 * (gameCount / totalGames))}
                                %
                            </div>
                            <div>{gameCount.toLocaleString()}</div>
                        </Stack>
                    );
                },
                flex: 0.75,
            },
            {
                field: 'results',
                headerName: 'Results',
                align: 'right',
                headerAlign: 'left',
                valueGetter: (
                    params: GridValueGetterParams<ExplorerMove | LichessExplorerMove>,
                ) => {
                    if (isExplorerMove(params.row)) {
                        return getResultCount(params.row, 'white', cohortRange);
                    }
                    return params.row.white;
                },
                renderCell: (
                    params: GridRenderCellParams<ExplorerMove | LichessExplorerMove>,
                ) => {
                    let graphParams: ResultGraphProps = {
                        totalGames: 0,
                        resultCount: {
                            white: 0,
                            black: 0,
                            draws: 0,
                            analysis: 0,
                        },
                    };
                    if (isExplorerMove(params.row)) {
                        graphParams = {
                            totalGames: getGameCount(params.row.results, cohortRange),
                            resultCount: {
                                white: getResultCount(params.row, 'white', cohortRange),
                                black: getResultCount(params.row, 'black', cohortRange),
                                draws: getResultCount(params.row, 'draws', cohortRange),
                                analysis: getResultCount(
                                    params.row,
                                    'analysis',
                                    cohortRange,
                                ),
                            },
                        };
                    } else {
                        graphParams = {
                            totalGames:
                                params.row.white + params.row.black + params.row.draws,
                            resultCount: {
                                white: params.row.white,
                                black: params.row.black,
                                draws: params.row.draws,
                                analysis: 0,
                            },
                        };
                    }
                    return <ResultGraph {...graphParams} />;
                },
                flex: 1,
            },
        ];
    }, [totalGames, cohortRange]);

    if (type === 'dojo' && isFreeTier) {
        return (
            <Box mt={2}>
                <UpsellAlert>
                    Upgrade to a full account to search the Dojo Database by position and
                    subscribe to positions.
                </UpsellAlert>
            </Box>
        );
    }

    if (!position && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    if (!position) {
        return (
            <Stack width={1} alignItems='center' mt={2}>
                <Typography>No games found in this position</Typography>
            </Stack>
        );
    }

    const onClickMove = (params: GridRowParams<ExplorerMove>) => {
        if (params.id !== 'Total') {
            chess?.move(params.id as string);
            reconcile();
        }
    };

    return (
        <Grid container columnSpacing={1} rowSpacing={2} mt={2}>
            {type === 'dojo' && (
                <>
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
                            {dojoCohorts.map((cohort, i) => (
                                <MenuItem
                                    key={cohort}
                                    value={cohort}
                                    disabled={
                                        Boolean(minCohort) &&
                                        dojoCohorts.indexOf(minCohort) > i
                                    }
                                >
                                    {cohort}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </>
            )}

            <Grid xs={12}>
                <StyledDataGrid
                    autoHeight
                    disableColumnMenu
                    disableColumnReorder
                    hideFooter
                    columns={columns}
                    rows={sortedMoves}
                    pinnedRows={pinnedRows}
                    getRowId={(row: GridRowModel<ExplorerMove | LichessExplorerMove>) =>
                        row.san
                    }
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
                                {type === 'dojo' &&
                                    cohortRange.length < dojoCohorts.length && (
                                        <Typography>
                                            Try expanding your cohort range.
                                        </Typography>
                                    )}
                            </Stack>
                        ),
                    }}
                    onRowClick={onClickMove}
                    sx={{
                        fontSize: '0.8rem',
                    }}
                />
            </Grid>

            {type === 'dojo' && (
                <Grid xs={12} display='flex' justifyContent='center'>
                    <Link
                        component={RouterLink}
                        to={`/games?type=position&fen=${fen}`}
                        target='_blank'
                        rel='noopener'
                    >
                        View all games containing this position
                    </Link>
                </Grid>
            )}
        </Grid>
    );
};

export default Database;

const resultKeys: (keyof ExplorerResult)[] = ['white', 'draws', 'black', 'analysis'];

const resultGraphColors = {
    white: '#ccc',
    draws: '#666',
    black: '#333',
    analysis: '#0288d1',
};

const resultGraphTextColors = {
    white: '#222',
    draws: '#ddd',
    black: '#fff',
    analysis: '#fff',
};

interface ResultGraphProps {
    totalGames: number;
    resultCount: Record<keyof ExplorerResult, number>;
}

const ResultGraph: React.FC<ResultGraphProps> = ({ totalGames, resultCount }) => {
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
            {resultKeys.map((k) => {
                const count = resultCount[k];
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
                                {count.toLocaleString()} Game{count !== 1 ? 's' : ''}
                                <br />
                                {Math.round(percentage * 10) / 10}%
                            </Box>
                        }
                    >
                        <Box
                            sx={{
                                width: `${percentage}%`,
                                minWidth: '26px',
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
                                    fontSize: '0.8rem',
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
