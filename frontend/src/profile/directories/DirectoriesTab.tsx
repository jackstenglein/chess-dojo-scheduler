import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useGame } from '@/games/view/GamePage';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import {
    compareRoles,
    DirectoryAccessRole,
    DirectoryItem,
    DirectoryItemTypes,
    SHARED_DIRECTORY_ID,
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
import { adminColumns, publicColumns } from './DirectoryGridColumns';
import { NavigationMenu } from './navigation/NavigationMenu';
import { ShareButton } from './share/ShareButton';

const pageSizeOptions = [10, 25, 50, 100];

export const DirectoriesTab = ({ username }: { username: string }) => {
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });

    const directoryId = searchParams.get('directory') || 'home';
    const directoryOwner = searchParams.get('directoryOwner') || username;

    const { game } = useGame();
    const api = useApi();
    const reorderRequest = useRequest();
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const contextMenu = useDataGridContextMenu(rowSelectionModel);

    console.log('Owner: ', directoryOwner);

    const { directory, accessRole, request, putDirectory } = useDirectory(
        directoryOwner,
        directoryId,
    );

    const rows = useMemo(() => {
        const seen = new Set<string>();
        return (
            (directory?.itemIds
                .filter((id) => {
                    const result = !seen.has(id);
                    seen.add(id);
                    return result;
                })
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

    const isEditor = compareRoles(DirectoryAccessRole.Editor, accessRole);
    const isAdmin = compareRoles(DirectoryAccessRole.Admin, accessRole);

    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({
                directory: params.row.id,
                directoryOwner:
                    directory.id === SHARED_DIRECTORY_ID
                        ? (params.row.addedBy ?? directoryOwner)
                        : directoryOwner,
            });
        } else {
            window.location.href = `/games/${params.row.metadata.cohort.replaceAll('+', '%2B')}/${params.row.metadata.id.replaceAll(
                '?',
                '%3F',
            )}?directory=${directoryId}&directoryOwner=${directoryOwner}`;
        }
    };

    const handleRowOrderChange = (params: GridRowOrderChangeParams) => {
        const newIds = rows.map((row) => row.id);
        const id = newIds.splice(params.oldIndex, 1)[0];
        newIds.splice(params.targetIndex, 0, id);

        api.updateDirectory({
            owner: directoryOwner,
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
        <Stack direction='row' columnGap={2}>
            <NavigationMenu id={directoryId} owner={directoryOwner} username={username} />

            <Stack spacing={2} alignItems='start' flexGrow={1}>
                <DirectoryBreadcrumbs owner={directoryOwner} id={directoryId} />

                <Stack
                    direction='row'
                    alignItems='center'
                    gap={2}
                    width={1}
                    flexWrap='wrap'
                >
                    <AddButton directory={directory} accessRole={accessRole} />
                    <ShareButton directory={directory} accessRole={accessRole} />

                    <BulkItemEditor
                        directory={directory}
                        itemIds={rowSelectionModel as string[]}
                        onClear={() => setRowSelectionModel([])}
                    />
                </Stack>

                <DataGridPro
                    data-cy='directories-data-grid'
                    rows={rows}
                    columns={isAdmin ? adminColumns : publicColumns}
                    onRowClick={onClickRow}
                    autoHeight
                    loading={!directory && request.isLoading()}
                    sx={{ width: 1 }}
                    slotProps={{
                        row: isEditor
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
                    checkboxSelection={isEditor}
                    checkboxSelectionVisibleOnly
                    onRowSelectionModelChange={setRowSelectionModel}
                    rowSelectionModel={rowSelectionModel}
                    rowReordering={isAdmin}
                    onRowOrderChange={handleRowOrderChange}
                    pagination
                    pageSizeOptions={pageSizeOptions}
                />

                <ContextMenu
                    directory={directory}
                    accessRole={accessRole}
                    itemIds={contextMenu.rowIds as string[]}
                    onClose={contextMenu.close}
                    position={contextMenu.position}
                />
            </Stack>
        </Stack>
    );
};

function getRowHeight(params: GridRowHeightParams) {
    if (typeof params.id === 'string' && params.id.includes('/')) {
        return 70;
    }
}
