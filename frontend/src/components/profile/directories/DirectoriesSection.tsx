import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { NavigationMenu } from '@/components/directories/navigation/NavigationMenu';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import {
    ALL_MY_UPLOADS_DIRECTORY_ID,
    compareRoles,
    DirectoryAccessRole,
    DirectoryItem,
    DirectoryItemTypes,
    isManagedDirectory,
    SHARED_DIRECTORY_ID,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Stack, SvgIcon, SxProps, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColumnVisibilityModel,
    GridDensity, GridListViewColDef, GridRenderCellParams,
    GridRowHeightParams,
    GridRowOrderChangeParams,
    GridRowParams,
    GridRowSelectionModel,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarFilterButton
} from '@mui/x-data-grid-pro';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { AddButton } from './AddButton';
import { AllUploadsSection } from './AllUploadsSection';
import { BulkItemEditor } from './BulkItemEditor';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';
import { adminColumns, publicColumns } from './DirectoryGridColumns';
import { ShareButton } from './share/ShareButton';
import CohortIcon from '@/scoreboard/CohortIcon.tsx';
import { MastersCohort } from '@/database/game.ts';
import { Folder } from '@mui/icons-material';

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

    isMobile?: boolean;

    /** The sx prop passed to the DataGrid component. */
    sx?: SxProps;
}

export const DirectoriesSection = (props: DirectoriesSectionProps) => {
    const { searchParams } = useNextSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const directoryOwner = searchParams.get('directoryOwner') || props.defaultDirectoryOwner;

    const isMobile = () => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [screenWidth, setScreenWidth] = useState(window.innerWidth);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            const handleResize = () => setScreenWidth(window.innerWidth);
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }, []);

        return screenWidth <= 1024;
    };

    if (directoryId === ALL_MY_UPLOADS_DIRECTORY_ID) {
        return (
            <AllUploadsSection
                namespace={props.namespace}
                username={directoryOwner}
                enableNavigationMenu={props.enableNavigationMenu}
                defaultNavigationMenuOpen={props.defaultNavigationMenuOpen}
                isMobile={isMobile()}
            />
        );
    }

    return <DirectorySection isMobile={isMobile()} {...props} />;
};

const DirectorySection = ({
    namespace,
    defaultDirectoryOwner,
    enableNavigationMenu,
    defaultNavigationMenuOpen,
    defaultColumnVisibility,
    isMobile,
    sx,
}: DirectoriesSectionProps) => {
    const api = useApi();
    const { searchParams, updateSearchParams } = useNextSearchParams({
        directory: 'home',
    });
    const router = useRouter();

    const [columnVisibility, setColumnVisibility] = useLocalStorage<GridColumnVisibilityModel>(
        `/DirectoryTable/${namespace}/visibility`,
        {
            type: true,
            name: true,
            result: true,
            ...(defaultColumnVisibility ?? {}),
        },
    );
    const [density, setDensity] = useLocalStorage<GridDensity>(
        `/DirectoryTable/density`,
        'standard',
    );

    const directoryId = searchParams.get('directory') || 'home';
    const directoryOwner = searchParams.get('directoryOwner') || defaultDirectoryOwner;

    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set([]),
    });
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

    const onClickRow = (params: GridRowParams<DirectoryItem>, event: React.MouseEvent) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({
                directory: params.row.id,
                directoryOwner:
                    directory.id === SHARED_DIRECTORY_ID
                        ? (params.row.addedBy ?? directory.owner)
                        : directory.owner,
            });
        } else {
            const url = `/games/${params.row.metadata.cohort.replaceAll('+', '%2B')}/${params.row.metadata.id.replaceAll(
                '?',
                '%3F',
            )}?directory=${directory.id}&directoryOwner=${directory.owner}`;
            if (event.shiftKey) {
                window.open(url, '_blank');
            } else {
                router.push(url);
            }
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
                putDirectory(resp.data.directory);
            })
            .catch((err) => {
                reorderRequest.onFailure(err);
                console.error('updateDirectory: ', err);
            });
    };

    const isEditor =
        compareRoles(DirectoryAccessRole.Editor, accessRole) && directoryId !== SHARED_DIRECTORY_ID;
    const isAdmin = compareRoles(DirectoryAccessRole.Admin, accessRole);

    return (
        <Stack direction={isMobile ? "column" : "row"} columnGap={2}>
            <NavigationMenu
                namespace={namespace}
                id={directoryId}
                owner={directoryOwner}
                enabled={enableNavigationMenu}
                defaultValue={defaultNavigationMenuOpen}
            />

            <Stack spacing={2} alignItems='start' flexGrow={1}>
                <DirectoryBreadcrumbs
                    owner={directoryOwner}
                    id={directoryId}
                    currentProfile={defaultDirectoryOwner}
                />

                {isEditor && (
                    <Stack direction='row' alignItems='center' gap={2} width={1} flexWrap='wrap'>
                        <AddButton directory={directory} accessRole={accessRole} />
                        <ShareButton directory={directory} accessRole={accessRole} />

                        <BulkItemEditor
                            directory={directory}
                            itemIds={[...rowSelectionModel.ids] as string[]}
                            onClear={() =>
                                setRowSelectionModel({ type: 'include', ids: new Set() })
                            }
                        />
                    </Stack>
                )}

                <DataGridPro
                    listViewColumn={listViewColDef}
                    listView={isMobile}
                    rows={rows}
                    columns={isAdmin ? adminColumns : publicColumns}
                    columnVisibilityModel={columnVisibility}
                    onColumnVisibilityModelChange={(model) => setColumnVisibility(model)}
                    density={density}
                    onDensityChange={(d) => setDensity(d)}
                    onRowClick={onClickRow}
                    loading={!directory && request.isLoading()}
                    slots={{
                        toolbar: CustomGridToolbar,
                    }}
                    slotProps={{
                        root: { 'data-cy': 'directories-data-grid' },
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
                    getRowHeight={isMobile ? getRowHeightMobile : getRowHeight}
                    checkboxSelection={isEditor}
                    checkboxSelectionVisibleOnly
                    onRowSelectionModelChange={setRowSelectionModel}
                    rowSelectionModel={rowSelectionModel}
                    isRowSelectable={isDirectorySelectable}
                    rowReordering={isAdmin && !isMobile}
                    onRowOrderChange={handleRowOrderChange}
                    pagination
                    pageSizeOptions={pageSizeOptions}
                    sx={{ width: 1, ...sx }}
                    showToolbar={!isMobile}
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

function ListViewCell(params: GridRenderCellParams) {
    console.log(params)
    if(params.row.type == "DIRECTORY"){
        return <Stack direction="row" alignItems="left" spacing={2} height={"100%"}>
            <Stack width="4rem" alignItems='center' justifyContent='center'>
                <Folder sx={{ height: 1 }} />
            </Stack>
            <Stack direction="column" alignItems="left" spacing={0} justifyContent='center'>
                <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>Created at {params.row.metadata.createdAt.substring(0, 10)}</Typography>
                <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>Updated at {params.row.metadata.updatedAt.substring(0, 10)}</Typography>
                <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>{params.row.metadata.description}</Typography>
            </Stack>
        </Stack>
    }
    return <Stack direction="row" alignItems="center" spacing={2} height={"100%"}>
        <Stack width="4rem" alignItems='center' justifyContent='center'>
            <CohortIcon
                cohort={params.row.metadata.cohort}
                tooltip={params.row.metadata.cohort}
                size={30}
            />
            <Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
                {params.row.metadata.cohort === MastersCohort ? 'masters' : params.row.metadata.cohort}
            </Typography>
        </Stack>
        <Stack direction="column">
            <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>{params.row.__reorder__}</Typography>
            <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>{params.row.metadata.result}</Typography>
            <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>{params.row.metadata.ownerDisplayName}</Typography>
            <Typography variant='body1' sx={{ fontSize: '0.75rem', textWrap: 'auto' }}>Created at {params.row.metadata.createdAt.substring(0, 10)}</Typography>
        </Stack>
    </Stack>
}

const listViewColDef: GridListViewColDef = {
    field: 'listColumn',
    renderCell: ListViewCell,
};

/**
 * Returns true if the directory is selectable in the data grid.
 */
function isDirectorySelectable(params: GridRowParams<DirectoryItem>) {
    return !isManagedDirectory(params.row.id);
}

function CustomGridToolbar() {
    return (
        <GridToolbarContainer>
            <GridToolbarColumnsButton />
            <GridToolbarDensitySelector />
            <GridToolbarFilterButton />
        </GridToolbarContainer>
    );
}

function getRowHeight(params: GridRowHeightParams) {
    if (typeof params.id === 'string' && params.id.includes('/')) {
        return 70;
    }
}

function getRowHeightMobile(params: GridRowHeightParams) {
    return 105
}
