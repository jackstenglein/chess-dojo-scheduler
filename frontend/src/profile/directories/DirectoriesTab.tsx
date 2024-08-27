import NotFoundPage from '@/NotFoundPage';
import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/calendar/displayDate';
import { User, dojoCohorts } from '@/database/user';
import { RenderPlayers, RenderResult } from '@/games/list/GameListItem';
import { MastersCohort, MastersOwnerDisplayName } from '@/games/list/ListGamesPage';
import { useGame } from '@/games/view/GamePage';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import CohortIcon from '@/scoreboard/CohortIcon';
import type { DirectoryItemType } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Folder } from '@mui/icons-material';
import { Link, Stack, Tooltip, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowHeightParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Avatar from '../Avatar';
import { AddButton } from './AddButton';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';

export const DirectoriesTab = ({ user }: { user: User }) => {
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const navigate = useNavigate();
    const { game } = useGame();

    const contextMenu = useDataGridContextMenu();

    const { directory, request } = useDirectory(user.username, directoryId);

    const rows = useMemo(() => {
        return Object.values(directory?.items || {}).sort((lhs, rhs) =>
            lhs.type.localeCompare(rhs.type),
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

    return (
        <Stack spacing={2} alignItems='start'>
            <DirectoryBreadcrumbs owner={user.username} id={directoryId} />

            <AddButton directory={directory} />

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
                        onContextMenu: contextMenu.open,
                    },
                }}
                initialState={{
                    sorting: {
                        sortModel: [{ field: 'type', sort: 'asc' }],
                    },
                    columns: {
                        columnVisibilityModel: {
                            createdAt: !game,
                            result: !game,
                        },
                    },
                }}
                getRowHeight={getRowHeight}
            />

            <ContextMenu
                directory={directory}
                selectedItem={directory.items[contextMenu.rowId]}
                onClose={contextMenu.close}
                position={contextMenu.position}
            />
        </Stack>
    );
};

const columns: GridColDef<DirectoryItem>[] = [
    {
        field: 'type',
        headerName: '',
        valueGetter(_value, row) {
            if (row.type === DirectoryItemTypes.DIRECTORY) {
                return -1;
            }
            if (row.metadata.cohort === MastersCohort) {
                return 2500;
            }
            return parseInt(row.metadata.cohort);
        },
        renderCell(params: GridRenderCellParams<DirectoryItem, DirectoryItemType>) {
            const item = params.row;

            if (item.type === DirectoryItemTypes.DIRECTORY) {
                return <Folder sx={{ height: 1 }} />;
            }

            let value = item.metadata.cohort;
            if (value && value !== dojoCohorts[0] && value !== dojoCohorts.slice(-1)[0]) {
                value = value.replace('00', '');
            }

            return (
                <Stack sx={{ height: 1 }} alignItems='center' justifyContent='center'>
                    <CohortIcon
                        cohort={item.metadata.cohort}
                        tooltip={item.metadata.cohort}
                        size={30}
                    />
                    <Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
                        {item.metadata.cohort === MastersCohort ? 'masters' : value}
                    </Typography>
                </Stack>
            );
        },
        align: 'center',
        headerAlign: 'center',
        width: 52,
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
        field: 'result',
        headerName: '',
        headerAlign: 'center',
        valueGetter: (_value, row) => {
            switch (row.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return '';
                default:
                    return row.metadata.result;
            }
        },
        renderCell: (params) => {
            if (params.row.type === DirectoryItemTypes.DIRECTORY) {
                return null;
            }
            return RenderResult(params);
        },
        width: 50,
        disableColumnMenu: true,
        flex: 0.25,
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
        flex: 0.5,
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
