import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { useGame } from '@/games/view/GamePage';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import {
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Stack } from '@mui/material';
import {
    DataGridPro,
    GridRowHeightParams,
    GridRowOrderChangeParams,
    GridRowParams,
    GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';
import { AddButton } from './AddButton';
import { BulkItemEditor } from './BulkItemEditor';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';
import { ownerColumns, publicColumns } from './DirectoryGridColumns';
import { ShareButton } from './ShareButton';

const pageSizeOptions = [10, 25, 50, 100];

export const DirectoriesTab = ({ username }: { username: string }) => {
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const { game } = useGame();
    const { user: viewer } = useAuth();
    const api = useApi();
    const reorderRequest = useRequest();
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const contextMenu = useDataGridContextMenu(rowSelectionModel);
    const { directory, request, putDirectory } = useDirectory(username, directoryId);

    const rows = useMemo(() => {
        return (
            (directory?.itemIds
                .map((id) => {
                    const item = directory.items[id];
                    if (!item) {
                        return undefined;
                    }

                    return {
                        ...item,
                        __reorder__:
                            item.type === DirectoryItemTypes.DIRECTORY
                                ? item.metadata.name
                                : `${item.metadata.white} - ${item.metadata.black}`,
                    };
                })
                .filter((item) => Boolean(item)) as DirectoryItem[]) ?? []
        );
    }, [directory]);

    if (!directory && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    if (!directory) {
        return <NotFoundPage />;
    }

    const isOwner = viewer?.username === username;

    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({ directory: params.row.id });
        } else {
            window.location.href = `/games/${params.row.metadata.cohort.replaceAll('+', '%2B')}/${params.row.metadata.id.replaceAll(
                '?',
                '%3F',
            )}?directory=${searchParams.get('directory')}&directoryOwner=${username}`;
        }
    };

    const handleRowOrderChange = (params: GridRowOrderChangeParams) => {
        const newIds = rows.map((row) => row.id);
        const id = newIds.splice(params.oldIndex, 1)[0];
        newIds.splice(params.targetIndex, 0, id);

        api.updateDirectory({
            id: directoryId,
            itemIds: newIds,
        })
            .then((resp) => {
                console.log('updateDirectory: ', resp);
                putDirectory(resp.data.directory);
            })
            .catch((err) => {
                reorderRequest.onFailure(err);
                console.error('updateDirectory: ', err);
            });
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <DirectoryBreadcrumbs owner={username} id={directoryId} />

            {isOwner && (
                <Stack
                    direction='row'
                    alignItems='center'
                    gap={2}
                    width={1}
                    flexWrap='wrap'
                    sx={{ minHeight: '42px' }}
                >
                    <AddButton directory={directory} />
                    <ShareButton directory={directory} />

                    <BulkItemEditor
                        directory={directory}
                        itemIds={rowSelectionModel as string[]}
                        onClear={() => setRowSelectionModel([])}
                    />
                </Stack>
            )}

            <DataGridPro
                data-cy='directories-data-grid'
                rows={rows}
                columns={isOwner ? ownerColumns : publicColumns}
                onRowClick={onClickRow}
                autoHeight
                loading={!directory && request.isLoading()}
                sx={{ width: 1 }}
                slotProps={{
                    row: isOwner
                        ? {
                              onContextMenu: contextMenu.open,
                          }
                        : undefined,
                }}
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            createdAt: !game,
                            result: !game,
                        },
                    },
                    pagination: {
                        paginationModel: { pageSize: 10 },
                    },
                }}
                getRowHeight={getRowHeight}
                checkboxSelection={isOwner}
                checkboxSelectionVisibleOnly
                onRowSelectionModelChange={setRowSelectionModel}
                rowSelectionModel={rowSelectionModel}
                rowReordering={isOwner}
                onRowOrderChange={handleRowOrderChange}
                pagination
                pageSizeOptions={pageSizeOptions}
            />

            <ContextMenu
                directory={directory}
                itemIds={contextMenu.rowIds as string[]}
                onClose={contextMenu.close}
                position={contextMenu.position}
            />
        </Stack>
    );
};

function getRowHeight(params: GridRowHeightParams) {
    if (typeof params.id === 'string' && params.id.includes('/')) {
        return 70;
    }
}
