import { Stack, Typography } from '@mui/material';
import { DataGrid, GridPaginationModel, GridRowParams } from '@mui/x-data-grid';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar } from '../api/Request';

import { GameInfo } from '../database/game';
import { User } from '../database/user';
import { gameTableColumns } from '../games/ListGamesPage';
import { usePagination } from '../games/pagination';

interface GamesTabProps {
    user: User;
}

const GamesTab: React.FC<GamesTabProps> = ({ user }) => {
    const navigate = useNavigate();
    const api = useApi();

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

    const setPaginationModel = ({ page, pageSize }: GridPaginationModel) => {
        setPage(page);
        setPageSize(pageSize);
    };

    return (
        <Stack spacing={2}>
            <RequestSnackbar request={request} />
            <Typography variant='body1'>
                Note: games uploaded through the original Google form are not viewable
                here. To find those games, perform a player search on the{' '}
                <Link to='/games'>Games page</Link>.
            </Typography>
            <DataGrid
                columns={gameTableColumns}
                rows={data}
                rowCount={rowCount}
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={setPaginationModel}
                paginationMode='server'
                loading={request.isLoading()}
                autoHeight
                rowHeight={70}
                onRowClick={onClickRow}
            />
        </Stack>
    );
};

export default GamesTab;
