import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
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
import { Stack, SxProps } from '@mui/material';
import {
    DataGridPro,
    GridColumnVisibilityModel,
    GridRowHeightParams,
    GridRowOrderChangeParams,
    GridRowParams,
    GridRowSelectionModel,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarFilterButton,
} from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { AddButton } from './AddButton';
import { BulkItemEditor } from './BulkItemEditor';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';
import { adminColumns, publicColumns } from './DirectoryGridColumns';
import { NavigationMenu } from './navigation/NavigationMenu';
import { ShareButton } from './share/ShareButton';

const pageSizeOptions = [10, 25, 50, 100] as const;

interface DirectoriesSectionProps {
    /** The namespace for the local storage data. */
    namespace: string;

    /** The default directory owner if not specified in query params. */
    defaultDirectoryOwner: string;

    /** Whether to enable the navigation menu. */
    enableNavigationMenu: boolean;

    /** Whether to default the navigation menu to open. */
    defaultNavigationMenuOpen?: boolean;

    /** The default column visibility, if the user has not changed any settings. */
    defaultColumnVisibility?: Record<string, boolean>;

    /** The sx prop passed to the DataGrid component. */
    sx?: SxProps;
}

export const DirectoriesSection = ({
    namespace,
    defaultDirectoryOwner,
    enableNavigationMenu,
    defaultNavigationMenuOpen,
    defaultColumnVisibility,
    sx,
}: DirectoriesSectionProps) => {
    const api = useApi();
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });

    const [columnVisibility, setColumnVisibility] =
        useLocalStorage<GridColumnVisibilityModel>(
            `/DirectoryTable/${namespace}/visibility`,
            {
                type: true,
                name: true,
                result: true,
                ...(defaultColumnVisibility ?? {}),
            },
        );

    const directoryId = searchParams.get('directory') || 'home';
    const directoryOwner = searchParams.get('directoryOwner') || defaultDirectoryOwner;

    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const contextMenu = useDataGridContextMenu(rowSelectionModel);

    const { directory, accessRole, request, putDirectory } = useDirectory(
        directoryOwner,
        directoryId,
    );
    const reorderRequest = useRequest();

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
    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({
                directory: params.row.id,
                directoryOwner:
                    directory.id === SHARED_DIRECTORY_ID
                        ? (params.row.addedBy ?? directory.owner)
                        : directory.owner,
            });
        } else {
            window.location.href = `/games/${params.row.metadata.cohort.replaceAll('+', '%2B')}/${params.row.metadata.id.replaceAll(
                '?',
                '%3F',
            )}?directory=${directory.id}&directoryOwner=${directory.owner}`;
        }
    };

    const handleRowOrderChange = (params: GridRowOrderChangeParams) => {
        const newIds = rows.map((row) => row.id);
        const id = newIds.splice(params.oldIndex, 1)[0];
        newIds.splice(params.targetIndex, 0, id);

        api.updateDirectory({
            owner: directory.owner,
            id: directory.id,
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

    const isEditor = compareRoles(DirectoryAccessRole.Editor, accessRole);
    const isAdmin = compareRoles(DirectoryAccessRole.Admin, accessRole);

    return (
        <Stack direction='row' columnGap={2}>
            <NavigationMenu
                namespace={namespace}
                id={directoryId}
                owner={directoryOwner}
                enabled={enableNavigationMenu}
                defaultValue={defaultNavigationMenuOpen}
            />

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
                    autoHeight
                    data-cy='directories-data-grid'
                    rows={rows}
                    columns={isAdmin ? adminColumns : publicColumns}
                    columnVisibilityModel={columnVisibility}
                    onColumnVisibilityModelChange={(model) => setColumnVisibility(model)}
                    onRowClick={onClickRow}
                    loading={!directory && request.isLoading()}
                    slots={{
                        toolbar: CustomGridToolbar,
                    }}
                    slotProps={{
                        row: isEditor
                            ? {
                                  onContextMenu: contextMenu.open,
                              }
                            : undefined,
                    }}
                    initialState={{
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
                    sx={{ width: 1, ...sx }}
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

function CustomGridToolbar() {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarFilterButton />
        </GridToolbarContainer>
    );
}

function getRowHeight(params: GridRowHeightParams) {
    if (typeof params.id === 'string' && params.id.includes('/')) {
        return 70;
    }
}
