import { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';
import { Link } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { User } from '../database/user';

const columns: GridColDef[] = [
    {
        field: 'displayName',
        headerName: 'Display Name',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.displayName || 'N/A',
        renderCell: (params: GridRenderCellParams<User, string>) => {
            return <Link to={`/profile/${params.row.username}`}>{params.value}</Link>;
        },
        flex: 1,
    },
    {
        field: 'discordUsername',
        headerName: 'Discord Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.discordUsername || 'N/A',
        flex: 1,
    },
    {
        field: 'dojoCohort',
        headerName: 'Dojo Cohort',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.dojoCohort || 'N/A',
        flex: 1,
    },
    {
        field: 'chesscomUsername',
        headerName: 'Chess.com Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.chesscomUsername || 'N/A',
        flex: 1,
    },
    {
        field: 'lichessUsername',
        headerName: 'Lichess Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
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
                pageSizeOptions={[5, 10, 20, 50]}
                getRowId={(row) => row.username}
            />
        </>
    );
};

export default UsersTab;
