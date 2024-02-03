import { Button, Stack, Tooltip } from '@mui/material';
import {
    DataGrid,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar } from '../api/Request';

import { GameInfo } from '../database/game';
import { User } from '../database/user';
import { gameTableColumns } from '../games/list/ListGamesPage';
import { usePagination } from '../games/list/pagination';
import { useAuth, useFreeTier } from '../auth/Auth';
import UpsellAlert from '../upsell/UpsellAlert';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface GamesTabProps {
    user: User;
}

const GamesTab: React.FC<GamesTabProps> = ({ user }) => {
    const navigate = useNavigate();
    const api = useApi();
    const currentUser = useAuth().user!;
    const isFreeTier = useFreeTier();
    const columns = useMemo(() => {
        const columns = gameTableColumns.filter((c) => c.field !== 'owner');
        if (currentUser.username === user.username) {
            columns.push({
                field: 'unlisted',
                headerName: 'Visibility',
                align: 'center',
                headerAlign: 'center',
                minWidth: 75,
                width: 75,
                renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
                    if (params.row.unlisted) {
                        return (
                            <Tooltip title='Unlisted'>
                                <VisibilityOff sx={{ color: 'text.secondary' }} />
                            </Tooltip>
                        );
                    }
                    return (
                        <Tooltip title='Public'>
                            <Visibility sx={{ color: 'text.secondary' }} />
                        </Tooltip>
                    );
                },
            });
        }
        return columns;
    }, [currentUser.username, user.username]);

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

    const onSubmit = () => {
        navigate('/games/submit');
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />
            {currentUser.username === user.username && (
                <Button variant='contained' onClick={onSubmit}>
                    Submit a Game
                </Button>
            )}

            {isFreeTier && currentUser.username !== user.username && (
                <Stack alignItems='center' mb={5}>
                    <UpsellAlert>
                        To avoid unfair preparation against Dojo members, free-tier users
                        cannot view games by a specific player. Upgrade your account to
                        view the full Dojo Database.
                    </UpsellAlert>
                </Stack>
            )}

            {(!isFreeTier || currentUser.username === user.username) && (
                <DataGrid
                    columns={columns}
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
                    initialState={{
                        sorting: {
                            sortModel: [
                                {
                                    field: 'publishedAt',
                                    sort: 'desc',
                                },
                            ],
                        },
                    }}
                />
            )}
        </Stack>
    );
};

export default GamesTab;
