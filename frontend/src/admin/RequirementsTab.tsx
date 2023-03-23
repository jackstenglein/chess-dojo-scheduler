import { Button, Container } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRowParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Requirement } from '../database/requirement';
import { dojoCohorts } from '../database/user';
import LoadingPage from '../loading/LoadingPage';

const columns: GridColDef<Requirement>[] = [
    {
        field: 'category',
        headerName: 'Category',
        minWidth: 175,
    },
    {
        field: 'name',
        headerName: 'Name',
        minWidth: 250,
    },
    {
        field: 'sortPriority',
        headerName: 'Sort Priority',
        align: 'center',
    },
    {
        field: 'unitScore',
        headerName: 'Unit Score',
        align: 'center',
    },
    {
        field: 'scoreboardDisplay',
        headerName: 'Scoreboard Display',
        minWidth: 175,
        align: 'center',
    },
    {
        field: 'numberOfPositions',
        headerName: 'Num Positions',
        valueGetter: (params: GridValueGetterParams<any, Requirement>) =>
            params.row.positionUrls?.length || 0,
        minWidth: 150,
        align: 'center',
    },
    {
        field: 'numberOfVideos',
        headerName: 'Num Videos',
        valueGetter: (params: GridValueGetterParams<any, Requirement>) =>
            params.row.videoUrls?.length || 0,
        minWidth: 150,
        align: 'center',
    },
    {
        field: 'numberOfCohorts',
        headerName: 'Num Cohorts',
        minWidth: 150,
        align: 'center',
    },
];

dojoCohorts.forEach((cohort) => {
    columns.push({
        field: cohort,
        headerName: cohort,
        valueGetter: (params: GridValueGetterParams<any, Requirement>) =>
            params.row.counts[cohort] || 0,
        align: 'center',
    });
});

const RequirementsTab = () => {
    const api = useApi();
    const request = useRequest<Requirement[]>();
    const [pageSize, setPageSize] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.adminListRequirements()
                .then((requirements) => request.onSuccess(requirements))
                .catch((err) => {
                    console.error('adminListRequirements: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const onClickRow = (params: GridRowParams<Requirement>) => {
        navigate(`/requirements/${params.row.id}`);
    };

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth={false}>
            <RequestSnackbar request={request} />

            <Button
                onClick={() => navigate('/requirements/new')}
                variant='contained'
                disableElevation
                sx={{ mb: 3 }}
            >
                Create Requirement
            </Button>

            <DataGrid
                columns={columns}
                rows={request.data ?? []}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => setPageSize(newSize)}
                rowsPerPageOptions={[5, 10, 20, 50]}
                sx={{ width: 1, mb: 4, height: 'calc(100vh - 120px)' }}
                onRowClick={onClickRow}
            />
        </Container>
    );
};

export default RequirementsTab;
