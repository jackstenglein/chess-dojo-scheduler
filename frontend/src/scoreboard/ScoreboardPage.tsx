import { useEffect, useMemo } from 'react';
import { Container } from '@mui/material';
import { useParams, Navigate } from 'react-router-dom';
import {
    DataGrid,
    GridColDef,
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
} from './scoreboardData';
import { User } from '../database/user';

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
            { field: 'cohortScore' },
            { field: 'percentComplete' },
            { field: 'ratingSystem' },
            { field: 'startRating' },
            { field: 'currentRating' },
            { field: 'ratingChange' },
        ],
    },
];

const usernameColumns: GridColDef[] = [
    {
        field: 'discordUsername',
        headerName: 'Discord ID',
        minWidth: 250,
    },
];

const userInfoColumns: GridColDef[] = [
    {
        field: 'ratingSystem',
        headerName: 'Rating System',
        minWidth: 250,
        valueFormatter: formatRatingSystem,
    },
    {
        field: 'startRating',
        headerName: 'Start Rating',
        minWidth: 250,
        valueGetter: getStartRating,
    },
    {
        field: 'currentRating',
        headerName: 'Current Rating',
        minWidth: 250,
        valueGetter: getCurrentRating,
    },
    {
        field: 'ratingChange',
        headerName: 'Rating Change',
        minWidth: 250,
        valueGetter: getRatingChange,
    },
];

const ScoreboardPage = () => {
    const user = useAuth().user!;
    const { cohort } = useParams<ScoreboardPageParams>();
    const requirementRequest = useRequest<Requirement[]>();
    const usersRequest = useRequest<User[]>();
    const api = useApi();

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
            console.log('Sending user request');
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
    }, [cohort, requirementRequest, usersRequest, api]);

    const requirements = useMemo(() => {
        return [...(requirementRequest.data ?? [])].sort(compareRequirements);
    }, [requirementRequest.data]);

    const cohortScoreColumns: GridColDef[] = useMemo(
        () => [
            {
                field: 'cohortScore',
                headerName: 'Cohort Score',
                minWidth: 150,
                valueGetter: (params: GridValueGetterParams<any, User>) =>
                    getCohortScore(params, cohort, requirements),
            },
            {
                field: 'percentComplete',
                headerName: 'Percent Complete',
                minWidth: 175,
                valueGetter: (params: GridValueGetterParams<any, User>) =>
                    getPercentComplete(params, cohort, requirements),
                valueFormatter: formatPercentComplete,
            },
        ],
        [requirements, cohort]
    );

    const requirementColumns: GridColDef[] = useMemo(() => {
        return requirements?.map((r) => getColumnDefinition(r, cohort)) ?? [];
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

            <DataGrid
                experimentalFeatures={{ columnGrouping: true }}
                columns={usernameColumns.concat(
                    cohortScoreColumns,
                    userInfoColumns,
                    requirementColumns
                )}
                columnGroupingModel={defaultColumnGroups.concat(columnGroups)}
                rows={usersRequest.data ?? []}
                loading={usersRequest.isLoading()}
                getRowId={(row: GridRowModel<User>) => row.username}
            />
        </Container>
    );
};

export default ScoreboardPage;
