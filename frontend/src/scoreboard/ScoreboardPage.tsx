import { useEffect, useMemo } from 'react';
import { Container, MenuItem, TextField, Typography } from '@mui/material';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridRowModel,
    GridValueGetterParams,
} from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import {
    formatPercentComplete,
    formatRatingSystem,
    getCategoryScore,
    getCohortScore,
    getColumnDefinition,
    getCurrentRating,
    getPercentComplete,
    getRatingChange,
    getStartRating,
    ScoreboardRow,
} from './scoreboardData';
import { dojoCohorts, User } from '../database/user';
import { Graduation } from '../database/graduation';
import GraduationIcon from './GraduationIcon';
import { useRequirements } from '../api/cache/requirements';
import ScoreboardProgress from './ScoreboardProgress';
import GraduationChips from './GraduationChips';

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

const defaultColumnGroups: ColumnGroup[] = [
    {
        groupId: 'User Info',
        children: [
            { field: 'displayName' },
            { field: 'previousCohort' },
            { field: 'ratingSystem' },
            { field: 'startRating' },
            { field: 'currentRating' },
            { field: 'ratingChange' },
        ],
    },
    {
        groupId: 'Progress',
        children: [
            { field: 'cohortScore' },
            { field: 'gamesAndAnalysisScore' },
            { field: 'middlegamesAndStrategyScore' },
            { field: 'tacticsScore' },
            { field: 'endgameScore' },
            { field: 'openingScore' },
            { field: 'percentComplete' },
        ],
    },
];

const userInfoColumns: GridColDef<ScoreboardRow>[] = [
    {
        field: 'displayName',
        headerName: 'Name',
        minWidth: 250,
        renderCell: (params: GridRenderCellParams<string, ScoreboardRow>) => {
            return <Link to={`/profile/${params.row.username}`}>{params.value}</Link>;
        },
    },
    {
        field: 'previousCohort',
        headerName: 'Graduation',
        renderCell: (params: GridRenderCellParams<string, ScoreboardRow>) => {
            return <GraduationIcon cohort={params.value} size={35} />;
        },
        align: 'center',
    },
    {
        field: 'ratingSystem',
        headerName: 'Rating System',
        minWidth: 175,
        valueFormatter: formatRatingSystem,
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
        true
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
                headerName: 'Cohort Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCohortScore(params, cohort, requirements),
                align: 'center',
            },
            {
                field: 'gamesAndAnalysisScore',
                headerName: 'Games + Analysis Score',
                minWidth: 200,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCategoryScore(params, cohort, 'Games + Analysis', requirements),
                align: 'center',
            },
            {
                field: 'middlegamesAndStrategyScore',
                headerName: 'Middlegames + Strategy Score',
                minWidth: 225,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCategoryScore(
                        params,
                        cohort,
                        'Middlegames + Strategy',
                        requirements
                    ),
                align: 'center',
            },
            {
                field: 'tacticsScore',
                headerName: 'Tactics Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCategoryScore(params, cohort, 'Tactics', requirements),
                align: 'center',
            },
            {
                field: 'endgameScore',
                headerName: 'Endgame Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCategoryScore(params, cohort, 'Endgame', requirements),
                align: 'center',
            },
            {
                field: 'openingScore',
                headerName: 'Opening Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCategoryScore(params, cohort, 'Opening', requirements),
                align: 'center',
            },
            {
                field: 'percentComplete',
                headerName: 'Percent Complete',
                minWidth: 175,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getPercentComplete(params, cohort, requirements),
                renderCell: (params: GridRenderCellParams<number, ScoreboardRow>) => (
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

    const requirementColumns: GridColDef<ScoreboardRow>[] = useMemo(() => {
        return requirements?.map((r) => getColumnDefinition(r, cohort!)) ?? [];
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

    console.log('Column groups: ', defaultColumnGroups.concat(columnGroups));

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={requirementRequest} />
            <RequestSnackbar request={usersRequest} />
            <TextField
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <GraduationChips cohort={cohort} />

            <Typography variant='h6'>Current Members</Typography>
            <DataGrid
                sx={{ mb: 4, height: 'calc(100vh - 120px)' }}
                experimentalFeatures={{ columnGrouping: true }}
                columns={userInfoColumns.concat(cohortScoreColumns, requirementColumns)}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={usersRequest.data ?? []}
                loading={usersRequest.isLoading()}
                getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
            />

            <Typography variant='h6'>Graduations</Typography>
            <DataGrid
                sx={{ mb: 4, height: 'calc(100vh - 120px)' }}
                experimentalFeatures={{ columnGrouping: true }}
                columns={userInfoColumns.concat(cohortScoreColumns, requirementColumns)}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={graduationsRequest.data ?? []}
                loading={graduationsRequest.isLoading()}
                getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
            />
        </Container>
    );
};

export default ScoreboardPage;
