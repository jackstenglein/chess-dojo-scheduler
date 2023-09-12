import { useEffect, useMemo } from 'react';
import {
    Container,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Link,
} from '@mui/material';
import { useParams, Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridRowModel,
    GridValueFormatterParams,
    GridValueGetterParams,
    GridColumnGroupingModel,
} from '@mui/x-data-grid';
import HelpIcon from '@mui/icons-material/Help';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import {
    formatPercentComplete,
    getRatingSystem,
    getCohortScore,
    getColumnDefinition,
    getCurrentRating,
    getPercentComplete,
    getRatingChange,
    getStartRating,
    getTotalTime,
    ScoreboardRow,
    getNormalizedRating,
    getMinutesSpent,
} from './scoreboardData';
import { dojoCohorts, User } from '../database/user';
import { Graduation } from '../database/graduation';
import GraduationIcon from './GraduationIcon';
import { useRequirements } from '../api/cache/requirements';
import ScoreboardProgress from './ScoreboardProgress';
import GraduationChips from './GraduationChips';
import { ScoreboardDisplay, formatTime } from '../database/requirement';
import ScoreboardTutorial from './ScoreboardTutorial';

interface ColumnGroupChild {
    field: string;
}

interface ColumnGroup {
    groupId: string;
    children: ColumnGroupChild[];
}

type ScoreboardPageParams = {
    cohort: string;
};

const defaultColumnGroups: GridColumnGroupingModel = [
    {
        groupId: 'User Info',
        children: [
            { field: 'displayName' },
            { field: 'previousCohort' },
            { field: 'ratingSystem' },
            { field: 'startRating' },
            { field: 'currentRating' },
            { field: 'ratingChange' },
            { field: 'normalizedRating' },
        ],
    },
    {
        groupId: 'Progress',
        children: [
            { field: 'cohortScore' },
            { field: 'cohortTime' },
            { field: 'percentComplete' },
        ],
    },
    {
        groupId: 'Time Spent',
        children: [
            { field: 'cohortTime2' },
            { field: 'last7DaysTime' },
            { field: 'last30DaysTime' },
            { field: 'last90DaysTime' },
            { field: 'last365DaysTime' },
            { field: 'nonDojoTime' },
        ],
        renderHeaderGroup: (params) => {
            return (
                <Stack direction='row' alignItems='center'>
                    {params.groupId}
                    <Tooltip title='Data for time spent in last X days is updated every 24 hours and does not include non-dojo activities'>
                        <HelpIcon sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                </Stack>
            );
        },
    },
];

const userInfoColumns: GridColDef<ScoreboardRow>[] = [
    {
        field: 'displayName',
        headerName: 'Name',
        minWidth: 250,
        renderCell: (params: GridRenderCellParams<ScoreboardRow, string>) => {
            return (
                <Link component={RouterLink} to={`/profile/${params.row.username}`}>
                    {params.value}
                </Link>
            );
        },
    },
    {
        field: 'previousCohort',
        headerName: 'Graduated',
        valueGetter: (params: GridValueGetterParams<ScoreboardRow>) => {
            if (params.row.graduationCohorts && params.row.graduationCohorts.length > 0) {
                return params.row.graduationCohorts;
            }
            return params.row.previousCohort;
        },
        renderCell: (params: GridRenderCellParams<ScoreboardRow>) => {
            let graduationCohorts = params.row.graduationCohorts;
            if (graduationCohorts && graduationCohorts.length > 0) {
                if (graduationCohorts.length > 3) {
                    graduationCohorts = graduationCohorts.slice(
                        graduationCohorts.length - 3
                    );
                }
                return (
                    <Stack direction='row'>
                        {graduationCohorts.map((c) => (
                            <GraduationIcon key={c} cohort={c} size={35} />
                        ))}
                    </Stack>
                );
            }
            return <GraduationIcon cohort={params.row.previousCohort} size={35} />;
        },
        align: 'center',
    },
    {
        field: 'ratingSystem',
        headerName: 'Rating System',
        minWidth: 175,
        valueGetter: getRatingSystem,
    },
    {
        field: 'startRating',
        headerName: 'Start Rating',
        minWidth: 150,
        valueGetter: getStartRating,
        align: 'center',
    },
    {
        field: 'currentRating',
        headerName: 'Current Rating',
        minWidth: 150,
        valueGetter: getCurrentRating,
        align: 'center',
    },
    {
        field: 'ratingChange',
        headerName: 'Rating Change',
        minWidth: 150,
        valueGetter: getRatingChange,
        align: 'center',
    },
    {
        field: 'normalizedRating',
        headerName: 'Normalized FIDE Rating',
        minWidth: 200,
        valueGetter: getNormalizedRating,
        align: 'center',
    },
];

const ScoreboardPage = () => {
    const user = useAuth().user!;
    const { cohort } = useParams<ScoreboardPageParams>();
    const usersRequest = useRequest<User[]>();
    const graduationsRequest = useRequest<Graduation[]>();
    const api = useApi();
    const navigate = useNavigate();
    const { requirements, request: requirementRequest } = useRequirements(
        cohort || '',
        false
    );

    useEffect(() => {
        if (cohort && cohort !== '' && !usersRequest.isSent()) {
            usersRequest.onStart();
            api.listUsersByCohort(cohort)
                .then((users) => {
                    usersRequest.onSuccess(users);
                })
                .catch((err) => {
                    console.error('listUsersByCohort: ', err);
                    usersRequest.onFailure(err);
                });
        }
        if (cohort && cohort !== '' && !graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByCohort(cohort)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, [cohort, usersRequest, graduationsRequest, api]);

    const cohortScoreColumns: GridColDef<ScoreboardRow>[] = useMemo(
        () => [
            {
                field: 'cohortScore',
                headerName: 'Dojo Score',
                minWidth: 125,
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getCohortScore(params, cohort, requirements),
                align: 'center',
            },
            {
                field: 'percentComplete',
                headerName: 'Percent Complete',
                minWidth: 175,
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getPercentComplete(params, cohort, requirements),
                renderCell: (params: GridRenderCellParams<ScoreboardRow, number>) => (
                    <ScoreboardProgress
                        value={params.value ?? 0}
                        max={100}
                        min={0}
                        label={formatPercentComplete(params.value ?? 0)}
                    />
                ),
                align: 'center',
            },
        ],
        [requirements, cohort]
    );

    const timeColumns: GridColDef<ScoreboardRow>[] = useMemo(
        () => [
            {
                field: 'cohortTime2',
                headerName: 'Cohort Tasks',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getTotalTime(params, cohort, false, requirements),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
            {
                field: 'last7DaysTime',
                headerName: 'Last 7 Days',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getMinutesSpent(params, 'LAST_7_DAYS'),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
            {
                field: 'last30DaysTime',
                headerName: 'Last 30 Days',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getMinutesSpent(params, 'LAST_30_DAYS'),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
            {
                field: 'last90DaysTime',
                headerName: 'Last 90 Days',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getMinutesSpent(params, 'LAST_90_DAYS'),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
            {
                field: 'last365DaysTime',
                headerName: 'Last 365 Days',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getMinutesSpent(params, 'LAST_365_DAYS'),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
            {
                field: 'nonDojoTime',
                headerName: 'Non-Dojo',
                valueGetter: (params: GridValueGetterParams<ScoreboardRow>) =>
                    getTotalTime(params, cohort, true, requirements),
                valueFormatter: (params: GridValueFormatterParams<number>) =>
                    formatTime(params.value),
                align: 'center',
                minWidth: 125,
                headerAlign: 'center',
            },
        ],
        [requirements, cohort]
    );

    const requirementColumns: GridColDef<ScoreboardRow>[] = useMemo(() => {
        return (
            requirements
                ?.filter(
                    (r) =>
                        r.category !== 'Welcome to the Dojo' &&
                        r.category !== 'Non-Dojo' &&
                        r.scoreboardDisplay !== ScoreboardDisplay.Hidden
                )
                .map((r) => getColumnDefinition(r, cohort!)) ?? []
        );
    }, [requirements, cohort]);

    const columnGroups = useMemo(() => {
        const categories: Record<string, ColumnGroup> = {};
        requirements?.forEach((r) => {
            if (categories[r.category] !== undefined) {
                categories[r.category].children.push({ field: r.id });
            } else {
                categories[r.category] = {
                    groupId: r.category,
                    children: [{ field: r.id }],
                };
            }
        });
        return Object.values(categories);
    }, [requirements]);

    const usersList = useMemo(() => {
        if (cohort === user.dojoCohort) {
            return [user].concat(
                usersRequest.data?.filter((u) => u.username !== user.username) ?? []
            );
        }
        return usersRequest.data ?? [];
    }, [user, usersRequest.data, cohort]);

    const onChangeCohort = (cohort: string) => {
        navigate(`../${cohort}`);
        usersRequest.reset();
        graduationsRequest.reset();
    };

    if (cohort === undefined || cohort === '') {
        return <Navigate to={`./${user.dojoCohort}`} replace />;
    }

    if (
        requirementRequest.isLoading() &&
        (requirements === undefined || requirements.length === 0)
    ) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={requirementRequest} />
            <RequestSnackbar request={usersRequest} />
            <TextField
                data-cy='scoreboard-cohort-select'
                id='scoreboard-cohort-select'
                select
                label='View'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                <MenuItem value='search'>User Search</MenuItem>
                <MenuItem value='stats'>Statistics</MenuItem>
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <GraduationChips cohort={cohort} />

            <Typography variant='h6'>Current Members</Typography>
            <DataGrid
                data-cy='current-members-scoreboard'
                sx={{ mb: 4, height: 'calc(100vh - 120px)' }}
                experimentalFeatures={{ columnGrouping: true }}
                columns={userInfoColumns.concat(
                    cohortScoreColumns,
                    timeColumns,
                    requirementColumns
                )}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={usersList}
                loading={usersRequest.isLoading()}
                getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
                initialState={{
                    sorting: {
                        sortModel: [{ field: 'cohortScore', sort: 'desc' }],
                    },
                }}
            />

            <Typography variant='h6'>Graduations</Typography>
            <div id='graduation-scoreboard'>
                <DataGrid
                    data-cy='graduates-scoreboard'
                    sx={{ mb: 4, height: 'calc(100vh - 120px)' }}
                    experimentalFeatures={{ columnGrouping: true }}
                    columns={userInfoColumns.concat(
                        cohortScoreColumns,
                        timeColumns.slice(0, 1),
                        timeColumns.slice(-1),
                        requirementColumns
                    )}
                    columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                    rows={graduationsRequest.data ?? []}
                    loading={graduationsRequest.isLoading()}
                    getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'cohortScore', sort: 'desc' }],
                        },
                    }}
                />
            </div>

            <ScoreboardTutorial />
        </Container>
    );
};

export default ScoreboardPage;
