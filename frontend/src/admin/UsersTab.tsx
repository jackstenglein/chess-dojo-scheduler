import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { User } from '../database/user';

const columns: GridColDef[] = [
    {
        field: 'discordUsername',
        headerName: 'Discord Username',
        valueGetter: (params: GridValueGetterParams<any, User>) =>
            params.row.discordUsername || 'N/A',
        flex: 1,
    },
    {
        field: 'dojoCohort',
        headerName: 'Dojo Cohort',
        valueGetter: (params: GridValueGetterParams<any, User>) =>
            params.row.dojoCohort || 'N/A',
        flex: 1,
    },
    {
        field: 'chesscomUsername',
        headerName: 'Chess.com Username',
        valueGetter: (params: GridValueGetterParams<any, User>) =>
            params.row.chesscomUsername || 'N/A',
        flex: 1,
    },
    {
        field: 'lichessUsername',
        headerName: 'Lichess Username',
        valueGetter: (params: GridValueGetterParams<any, User>) =>
            params.row.lichessUsername || 'N/A',
        flex: 1,
    },
];

const UsersTab = () => {
    const api = useApi();
    const request = useRequest<User[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.adminListUsers()
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
                getRowId={(row) => row.username}
            />
        </>
    );
};

export default UsersTab;
