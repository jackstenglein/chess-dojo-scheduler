import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Availability } from '../database/availability';

const columns: GridColDef[] = [
    {
        field: 'ownerDiscord',
        headerName: 'Owner Discord',
        minWidth: 150,
    },
    {
        field: 'ownerCohort',
        headerName: 'Owner Cohort',
        minWidth: 120,
    },
    {
        field: 'startTime',
        headerName: 'Start Time',
        minWidth: 200,
    },
    {
        field: 'endTime',
        headerName: 'End Time',
        minWidth: 200,
    },
    {
        field: 'types',
        headerName: 'Types',
        valueGetter: (params: GridValueGetterParams<any, Availability>) =>
            params.row.types.join(', '),
        minWidth: 300,
    },
    {
        field: 'cohorts',
        headerName: 'Cohorts',
        valueGetter: (params: GridValueGetterParams<any, Availability>) =>
            params.row.cohorts.join(', '),
        minWidth: 300,
    },
];

const AvailabilitiesTab = () => {
    const api = useApi();
    const request = useRequest<Availability[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listAvailabilities()
                .then((response) => {
                    request.onSuccess(response);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <CircularProgress />;
    }

    return (
        <>
            <RequestSnackbar request={request} />

            <DataGrid
                autoHeight
                columns={columns}
                rows={request.data ?? []}
                pageSize={20}
                rowsPerPageOptions={[5, 10, 20, 50]}
            />
        </>
    );
};

export default AvailabilitiesTab;
