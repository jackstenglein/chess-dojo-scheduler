import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { gameTableColumns } from '@/components/games/list/GameTable';
import { CustomPagination } from '@/components/ui/CustomPagination';
import { GameInfo } from '@/database/game';
import { usePagination } from '@/hooks/usePagination';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Tooltip,
} from '@mui/material';
import {
    DataGridPro,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowSelectionModel,
    useGridApiRef,
} from '@mui/x-data-grid-pro';
import { useCallback, useState } from 'react';
import { useDirectoryCache } from './DirectoryCache';

const columns = gameTableColumns
    .filter((c) => c.field !== 'owner')
    .concat({
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
                        <VisibilityOff sx={{ color: 'text.secondary', height: 1 }} />
                    </Tooltip>
                );
            }
            return (
                <Tooltip title='Public'>
                    <Visibility sx={{ color: 'text.secondary', height: 1 }} />
                </Tooltip>
            );
        },
    });

export const AddExistingGamesDialog = ({
    directory,
    onCancel,
}: {
    directory: Directory;
    onCancel: () => void;
}) => {
    const api = useApi();
    const { user } = useRequiredAuth();
    const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
    const addRequest = useRequest();
    const gridApiRef = useGridApiRef();
    const cache = useDirectoryCache();

    const searchByOwner = useCallback(
        (startKey: string) => api.listGamesByOwner(user.username, startKey),
        [api, user.username],
    );

    const filterGames = useCallback(
        (game: GameInfo) => {
            return !directory.items[`${game.cohort}/${game.id}`];
        },
        [directory],
    );

    const { request, data, rowCount, page, pageSize, hasMore, setPage, setPageSize } =
        usePagination(searchByOwner, 0, 10, filterGames);

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onAdd = () => {
        if (selectedRows.length === 0 || addRequest.isLoading()) {
            return;
        }

        const rows = gridApiRef.current.getSelectedRows();
        if (rows.size !== selectedRows.length) {
            console.error(
                `Grid API getSelectedRows has size ${rows.size} but state selectedRows has size ${selectedRows.length}`,
            );
            return;
        }

        const games = [];
        for (const row of rows.values()) {
            const game = row as GameInfo;
            games.push({
                owner: game.owner,
                ownerDisplayName: game.ownerDisplayName,
                createdAt:
                    game.createdAt ||
                    game.date.replaceAll('.', '-') ||
                    new Date().toISOString(),
                id: game.id,
                cohort: game.cohort,
                white: game.headers.White,
                black: game.headers.Black,
                whiteElo: game.headers.WhiteElo,
                blackElo: game.headers.BlackElo,
                result: game.headers.Result,
            });
        }

        addRequest.onStart();
        api.addDirectoryItems({ id: directory.id, games })
            .then((resp) => {
                console.log('addDirectoryItems: ', resp);
                cache.put(resp.data.directory);
                request.onSuccess();
                trackEvent(EventType.AddDirectoryItems, {
                    count: games.length,
                    method: 'add_existing_games_dialog',
                });
                onCancel();
            })
            .catch((err) => {
                console.error('addDirectoryItems: ', err);
                addRequest.onFailure(err);
            });
    };

    return (
        <Dialog
            open={true}
            onClose={addRequest.isLoading() ? undefined : onCancel}
            fullWidth
            maxWidth='md'
        >
            <DialogTitle>Add Games to {directory.name}?</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 1 }}>
                    Click games to select. Use Shift+Click or Cmd/Ctrl+Click to select
                    multiple games.
                </DialogContentText>

                <DataGridPro
                    apiRef={gridApiRef}
                    columns={columns}
                    rows={data}
                    pageSizeOptions={[5, 10, 25]}
                    paginationModel={{ page: data.length > 0 ? page : 0, pageSize }}
                    onPaginationModelChange={onPaginationModelChange}
                    loading={request.isLoading()}
                    autoHeight
                    rowHeight={70}
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
                    pagination
                    slots={{
                        pagination: () => (
                            <CustomPagination
                                page={page}
                                pageSize={pageSize}
                                count={rowCount}
                                hasMore={hasMore}
                                onPrevPage={() => setPage(page - 1)}
                                onNextPage={() => setPage(page + 1)}
                            />
                        ),
                    }}
                    checkboxSelection
                    checkboxSelectionVisibleOnly
                    onRowSelectionModelChange={setSelectedRows}
                    rowSelectionModel={selectedRows}
                />
            </DialogContent>

            <DialogActions>
                <Button disabled={addRequest.isLoading()} onClick={onCancel}>
                    Cancel
                </Button>

                <LoadingButton
                    disabled={selectedRows.length === 0}
                    loading={addRequest.isLoading()}
                    onClick={onAdd}
                >
                    {selectedRows.length
                        ? `Add ${selectedRows.length} Game${selectedRows.length > 1 ? 's' : ''}`
                        : 'Add Games'}
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
            <RequestSnackbar request={addRequest} />
        </Dialog>
    );
};
