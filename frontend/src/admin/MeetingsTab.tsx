import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { getDisplayString } from '../database/availability';
import { Meeting } from '../database/meeting';

const columns: GridColDef[] = [
    {
        field: 'startTime',
        headerName: 'Start Time',
        minWidth: 200,
        flex: 1,
    },
    {
        field: 'type',
        headerName: 'Type',
        valueGetter: (params: GridValueGetterParams<any, Meeting>) =>
            getDisplayString(params.row.type),
        flex: 1,
    },
    {
        field: 'location',
        headerName: 'Location',
        valueGetter: (params: GridValueGetterParams<any, Meeting>) =>
            params.row.location || 'Discord',
        flex: 1,
    },
];

const MeetingsTab = () => {
    const api = useApi();
    const request = useRequest<Meeting[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.adminListMeetings()
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

export default MeetingsTab;
