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
import { compareRequirements, Requirement } from '../database/requirement';
import {
    formatPercentComplete,
    formatRatingSystem,
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
            { field: 'discordUsername' },
            { field: 'previousCohort' },
            { field: 'cohortScore' },
            { field: 'percentComplete' },
            { field: 'ratingSystem' },
            { field: 'startRating' },
            { field: 'currentRating' },
            { field: 'ratingChange' },
        ],
    },
];

const usernameColumns: GridColDef<ScoreboardRow>[] = [
    {
        field: 'discordUsername',
        headerName: 'Discord ID',
        minWidth: 250,
        renderCell: (params: GridRenderCellParams<string, ScoreboardRow>) => {
            return <Link to={`/profile/${params.row.username}`}>{params.value}</Link>;
        },
    },
    {
        field: 'previousCohort',
        headerName: 'Graduation',
        renderHeader: () => {
            return '';
        },
        renderCell: (params: GridRenderCellParams<string, ScoreboardRow>) => {
            return <GraduationIcon cohort={params.value} size={35} />;
        },
        align: 'center',
    },
];

const userInfoColumns: GridColDef<ScoreboardRow>[] = [
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
    },
    {
        field: 'currentRating',
        headerName: 'Current Rating',
        minWidth: 150,
        valueGetter: getCurrentRating,
    },
    {
        field: 'ratingChange',
        headerName: 'Rating Change',
        minWidth: 150,
        valueGetter: getRatingChange,
    },
];

const ScoreboardPage = () => {
    const user = useAuth().user!;
    const { cohort } = useParams<ScoreboardPageParams>();
    const requirementRequest = useRequest<Requirement[]>();
    const usersRequest = useRequest<User[]>();
    const graduationsRequest = useRequest<Graduation[]>();
    const api = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        if (cohort && cohort !== '' && !requirementRequest.isSent()) {
            requirementRequest.onStart();

            api.listRequirements(cohort, true)
                .then((requirements) => {
                    requirementRequest.onSuccess(requirements);
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    requirementRequest.onFailure(err);
                });
        }
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
            api.listGraduations(cohort)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, [cohort, requirementRequest, usersRequest, graduationsRequest, api]);

    const requirements = useMemo(() => {
        return [...(requirementRequest.data ?? [])].sort(compareRequirements);
    }, [requirementRequest.data]);

    const cohortScoreColumns: GridColDef<ScoreboardRow>[] = useMemo(
        () => [
            {
                field: 'cohortScore',
                headerName: 'Cohort Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getCohortScore(params, cohort, requirements),
            },
            {
                field: 'percentComplete',
                headerName: 'Percent Complete',
                minWidth: 175,
                valueGetter: (params: GridValueGetterParams<any, ScoreboardRow>) =>
                    getPercentComplete(params, cohort, requirements),
                valueFormatter: formatPercentComplete,
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
        requirementRequest.reset();
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
        <Container maxWidth='xl' className='full-height' sx={{ pt: 4, pb: 4 }}>
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

            <Typography variant='h6'>Current Members</Typography>
            <DataGrid
                sx={{ mb: 4 }}
                experimentalFeatures={{ columnGrouping: true }}
                columns={usernameColumns.concat(
                    cohortScoreColumns,
                    userInfoColumns,
                    requirementColumns
                )}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={usersRequest.data ?? []}
                loading={usersRequest.isLoading()}
                getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
            />

            <Typography variant='h6'>Graduations</Typography>
            <DataGrid
                sx={{ mb: 4 }}
                experimentalFeatures={{ columnGrouping: true }}
                columns={usernameColumns.concat(
                    cohortScoreColumns,
                    userInfoColumns,
                    requirementColumns
                )}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={graduationsRequest.data ?? []}
                loading={graduationsRequest.isLoading()}
                getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
            />
        </Container>
    );
};

export default ScoreboardPage;
