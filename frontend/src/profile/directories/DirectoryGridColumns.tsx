import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/calendar/displayDate';
import { RenderPlayers, RenderResult } from '@/components/games/list/GameListItem';
import {
    MastersCohort,
    MastersOwnerDisplayName,
} from '@/components/games/list/GameTable';
import { dojoCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import {
    DirectoryItem,
    DirectoryItemType,
    DirectoryItemTypes,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Folder, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, Stack, Tooltip, Typography } from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { Link as RouterLink } from 'react-router-dom';
import Avatar from '../Avatar';

export const publicColumns: GridColDef<DirectoryItem>[] = [
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
                return (
                    <Link color='inherit' sx={{ cursor: 'pointer' }}>
                        {params.value}
                    </Link>
                );
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

export const ownerColumns: GridColDef<DirectoryItem>[] = [
    ...publicColumns.slice(0, 2),
    {
        field: 'result',
        headerName: '',
        headerAlign: 'center',
        valueGetter: (_value, row) => {
            switch (row.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return row.metadata.visibility;
                default:
                    return row.metadata.result;
            }
        },
        renderCell: (params) => {
            if (params.row.type === DirectoryItemTypes.DIRECTORY) {
                const isPublic =
                    params.row.metadata.visibility === DirectoryVisibility.PUBLIC;
                return (
                    <Stack
                        width={1}
                        height={1}
                        alignItems='center'
                        justifyContent='center'
                    >
                        <Tooltip
                            title={
                                isPublic
                                    ? 'This directory is public'
                                    : 'This directory is private'
                            }
                        >
                            {isPublic ? (
                                <Visibility sx={{ color: 'text.secondary' }} />
                            ) : (
                                <VisibilityOff sx={{ color: 'text.secondary' }} />
                            )}
                        </Tooltip>
                    </Stack>
                );
            }
            return RenderResult(params);
        },
        width: 50,
        disableColumnMenu: true,
        flex: 0.25,
    },
    ...publicColumns.slice(3),
];

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
