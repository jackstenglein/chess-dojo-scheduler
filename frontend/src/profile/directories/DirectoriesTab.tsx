import NotFoundPage from '@/NotFoundPage';
import { useAuth, useRequiredAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/calendar/displayDate';
import { User } from '@/database/user';
import { RenderPlayers } from '@/games/list/GameListItem';
import { MastersOwnerDisplayName } from '@/games/list/ListGamesPage';
import { useGame } from '@/games/view/GamePage';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import CohortIcon from '@/scoreboard/CohortIcon';
import type { DirectoryItemType } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Folder } from '@mui/icons-material';
import { Link, Stack, Tooltip } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowHeightParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Avatar from '../Avatar';
import { AddCurrentGameButton } from './AddCurrentGameButton';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';
import { NewDirectoryButton } from './NewDirectoryButton';

export const DirectoriesTab = ({ user }: { user: User }) => {
    const { user: viewer } = useRequiredAuth();
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const navigate = useNavigate();
    const { game } = useGame();

    const [selectedRowId, setSelectedRowId] = useState('');
    const [contextMenuPosition, setContextMenuPosition] = useState<{
        mouseX: number;
        mouseY: number;
    }>();

    const { directory, request, putDirectory } = useDirectory(user.username, directoryId);

    const rows = useMemo(() => {
        return Object.values(directory?.items || {});
    }, [directory]);

    if (!directory && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    }

    if (!directory) {
        return <NotFoundPage />;
    }

    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({ directory: params.row.id });
        } else {
            navigate(
                `/games/${params.row.metadata.cohort.replaceAll('+', '%2B')}/${params.row.metadata.id.replaceAll(
                    '?',
                    '%3F',
                )}?directory=${searchParams.get('directory')}`,
            );
        }
    };

    const openContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setSelectedRowId(event.currentTarget.getAttribute('data-id') || '');
        setContextMenuPosition(
            contextMenuPosition
                ? undefined
                : { mouseX: event.clientX - 2, mouseY: event.clientY - 4 },
        );
    };

    const closeContextMenu = () => {
        setSelectedRowId('');
        setContextMenuPosition(undefined);
    };

    return (
        <Stack spacing={2} alignItems='start'>
            {viewer.username === user.username && (
                <Stack direction='row' spacing={1}>
                    <NewDirectoryButton parent={directory.id} onSuccess={putDirectory} />
                    <AddCurrentGameButton directory={directory} />
                </Stack>
            )}

            <DirectoryBreadcrumbs owner={user.username} id={directoryId} />

            <DataGridPro
                data-cy='directories-data-grid'
                rows={rows}
                columns={columns}
                onRowClick={onClickRow}
                autoHeight
                loading={!directory && request.isLoading()}
                sx={{ width: 1 }}
                slotProps={{
                    row: {
                        onContextMenu: openContextMenu,
                    },
                }}
                initialState={{
                    sorting: {
                        sortModel: [{ field: 'type', sort: 'asc' }],
                    },
                    columns: {
                        columnVisibilityModel: {
                            createdAt: !game,
                        },
                    },
                }}
                getRowHeight={getRowHeight}
            />

            <ContextMenu
                directory={directory}
                selectedItem={directory.items[selectedRowId]}
                onClose={closeContextMenu}
                position={contextMenuPosition}
            />
        </Stack>
    );
};

const columns: GridColDef<DirectoryItem>[] = [
    {
        field: 'type',
        headerName: '',
        renderCell(params: GridRenderCellParams<DirectoryItem, DirectoryItemType>) {
            const item = params.row;

            switch (item.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return <Folder sx={{ height: 1 }} />;

                case DirectoryItemTypes.OWNED_GAME:
                case DirectoryItemTypes.DOJO_GAME:
                case DirectoryItemTypes.MASTER_GAME:
                    return (
                        <Stack
                            sx={{ height: 1 }}
                            alignItems='center'
                            justifyContent='center'
                        >
                            <CohortIcon
                                cohort={item.metadata.cohort}
                                tooltip={item.metadata.cohort}
                                size={25}
                            />
                        </Stack>
                    );
            }
        },
        align: 'center',
        width: 25,
        disableColumnMenu: true,
        resizable: false,
    },
    {
        field: 'name',
        headerName: 'Name',
        valueGetter: (_value, row) => {
            switch (row.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return row.metadata.name;
            }
            return '';
        },
        renderCell: (params: GridRenderCellParams<DirectoryItem, string>) => {
            const item = params.row;
            if (item.type === DirectoryItemTypes.DIRECTORY) {
                return params.value;
            }

            return RenderPlayers({ ...item.metadata, fullHeight: true });
        },
        flex: 1,
    },
    {
        field: 'owner',
        headerName: 'Owner',
        valueGetter: (_value, row) => {
            switch (row.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return '';
                default:
                    return row.metadata.owner;
            }
        },
        renderCell: (params: GridRenderCellParams<DirectoryItem, string>) => {
            const item = params.row;
            if (
                item.type === DirectoryItemTypes.DIRECTORY ||
                item.metadata.ownerDisplayName === ''
            ) {
                return null;
            }

            if (item.metadata.ownerDisplayName === MastersOwnerDisplayName) {
                return MastersOwnerDisplayName;
            }

            return (
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    onClick={(e) => e.stopPropagation()}
                >
                    <Avatar
                        username={item.metadata.owner}
                        displayName={item.metadata.ownerDisplayName}
                        size={32}
                    />
                    <Link component={RouterLink} to={`/profile/${item.metadata.owner}`}>
                        {item.metadata.ownerDisplayName}
                    </Link>
                </Stack>
            );
        },
        flex: 1,
    },
    {
        field: 'createdAt',
        headerName: 'Date Created',
        valueGetter: (_value, row) => row.metadata.createdAt,
        renderCell(params: GridRenderCellParams<DirectoryItem, string>) {
            return <DirectoryCreatedAt createdAt={params.value} />;
        },
        width: 110,
        align: 'center',
    },
];

function getRowHeight(params: GridRowHeightParams) {
    if (typeof params.id === 'string' && params.id.includes('#')) {
        return 70;
    }
}

function DirectoryCreatedAt({ createdAt }: { createdAt?: string }) {
    const { user } = useAuth();

    if (!createdAt) {
        return null;
    }

    const d = new Date(createdAt);
    const date = toDojoDateString(d, user?.timezoneOverride);
    const time = toDojoTimeString(d, user?.timezoneOverride, user?.timeFormat);

    return (
        <Tooltip title={`${date} • ${time}`}>
            <span>{date}</span>
        </Tooltip>
    );
}
