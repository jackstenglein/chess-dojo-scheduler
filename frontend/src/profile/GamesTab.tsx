import { Button, Stack } from '@mui/material';
import { DataGrid, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar } from '../api/Request';

import { GameInfo } from '../database/game';
import { User } from '../database/user';
import { gameTableColumns } from '../games/list/ListGamesPage';
import { usePagination } from '../games/list/pagination';
import { useAuth } from '../auth/Auth';

interface GamesTabProps {
    user: User;
}

const GamesTab: React.FC<GamesTabProps> = ({ user }) => {
    const navigate = useNavigate();
    const api = useApi();
    const currentUser = useAuth().user!;

    const searchByOwner = useCallback(
        (startKey: string) => api.listGamesByOwner(user.username, startKey),
        [api, user.username]
    );

    const { request, data, rowCount, page, pageSize, setPage, setPageSize } =
        usePagination(searchByOwner, 0, 10);

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `/games/${params.row.cohort.replaceAll(
                '+',
                '%2B'
            )}/${params.row.id.replaceAll('?', '%3F')}`
        );
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.page !== page) {
            setPage(model.page);
        }
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />
            {currentUser.username === user.username && (
                <Button variant='contained' onClick={() => navigate('/games/submit')}>
                    Submit a Game
                </Button>
            )}

            <DataGrid
                columns={gameTableColumns}
                rows={data}
                rowCount={rowCount}
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page: data.length > 0 ? page : 0, pageSize }}
                onPaginationModelChange={onPaginationModelChange}
                paginationMode='server'
                loading={request.isLoading()}
                autoHeight
                rowHeight={70}
                onRowClick={onClickRow}
                sx={{ width: 1 }}
            />
        </Stack>
    );
};

export default GamesTab;
