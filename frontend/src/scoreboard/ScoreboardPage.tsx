import { useEffect, useMemo } from 'react';
import { Container } from '@mui/material';
import { useParams, Navigate } from 'react-router-dom';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import { compareRequirements, Requirement } from '../database/requirement';

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

const ScoreboardPage = () => {
    const user = useAuth().user!;
    const { cohort } = useParams<ScoreboardPageParams>();
    const request = useRequest<Requirement[]>();
    const api = useApi();

    useEffect(() => {
        if (cohort && cohort !== '' && !request.isSent()) {
            request.onStart();

            api.listRequirements(cohort, true)
                .then((requirements) => {
                    request.onSuccess(requirements);
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    request.onFailure(err);
                });
        }
    }, [cohort, request, api]);

    const requirements = useMemo(() => {
        return [...(request.data ?? [])].sort(compareRequirements);
    }, [request.data]);
    console.log('Requirements: ', requirements);

    const columns: GridColDef[] = useMemo(() => {
        return (
            requirements?.map((r) => ({
                field: r.id,
                headerName: r.name,
                minWidth: 250,
            })) ?? []
        );
    }, [requirements]);

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
        request.isLoading() &&
        (requirements === undefined || requirements.length === 0)
    ) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth='xl' className='full-height' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <DataGrid
                experimentalFeatures={{ columnGrouping: true }}
                columns={columns}
                columnGroupingModel={columnGroups}
                rows={[]}
            />
        </Container>
    );
};

export default ScoreboardPage;
