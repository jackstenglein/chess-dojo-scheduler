import { useFreeTier } from '@/auth/Auth';
import { CustomPagination } from '@/components/ui/CustomPagination';
import { GameInfo } from '@/database/game';
import { dojoCohorts } from '@/database/user';
import { DataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { PaginationResult } from '@/hooks/usePagination';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Link, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { RenderPlayersCell, RenderResult } from './GameListItem';

export const MastersCohort = 'masters';
export const MastersOwnerDisplayName = 'Masters DB';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 65,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            let value = params.value;
            if (value && value !== dojoCohorts[0] && value !== dojoCohorts.slice(-1)[0]) {
                value = value.replace('00', '');
            }

            return (
                <Stack sx={{ height: 1 }} alignItems='center' justifyContent='center'>
                    <CohortIcon cohort={params.value} tooltip={params.value} size={30} />
                    <Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
                        {value === MastersCohort ? 'masters' : value}
                    </Typography>
                </Stack>
            );
        },
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
        minWidth: 150,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            if (
                params.row.ownerDisplayName === '' ||
                params.row.ownerDisplayName === MastersOwnerDisplayName
            ) {
                return '';
            }

            return (
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    onClick={(e) => e.stopPropagation()}
                >
                    <Avatar
                        username={params.row.owner}
                        displayName={params.row.ownerDisplayName}
                        size={32}
                    />
                    <Link component={RouterLink} to={`/profile/${params.row.owner}`}>
                        {params.row.ownerDisplayName}
                    </Link>
                </Stack>
            );
        },
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (_value, row) =>
            `${row.headers.White} (${row.headers.WhiteElo}) - ${row.headers.Black} (${row.headers.BlackElo})`,
        renderCell: RenderPlayersCell,
        flex: 1,
        minWidth: 150,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (_value, row) => row.headers?.Result,
        renderCell: RenderResult,
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
    {
        field: 'moves',
        headerName: 'Moves',
        valueGetter: (_value, row) =>
            row.headers?.PlyCount ? Math.ceil(parseInt(row.headers.PlyCount) / 2) : '?',
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
    {
        field: 'publishedAt',
        headerName: 'Publish Date',
        valueGetter: (_value, row) => {
            return row.publishedAt || row.createdAt || row.id.split('_')[0];
        },
        valueFormatter: (value: string) => value.split('T')[0].replaceAll('-', '.'),
        width: 120,
        align: 'right',
        headerAlign: 'right',
    },
    {
        field: 'date',
        headerName: 'Date Played',
        width: 110,
        align: 'right',
        headerAlign: 'right',
    },
];

interface GameTableProps {
    pagination: PaginationResult;
    type: string;
    onPaginationModelChange: (model: GridPaginationModel) => void;
    onClickRow: (params: GridRowParams<GameInfo>) => void;
    contextMenu: DataGridContextMenu;
}

export default function GameTable({
    pagination,
    type,
    onPaginationModelChange,
    onClickRow,
    contextMenu,
}: GameTableProps) {
    const isFreeTier = useFreeTier();
    const { data, request, page, pageSize, rowCount, hasMore, setPage } = pagination;

    const columns = useMemo(() => {
        let columns = gameTableColumns;
        if (type === 'owner') {
            columns = columns.filter((c) => c.field !== 'owner');
        }
        if (isFreeTier) {
            columns = columns.map((col) => ({
                ...col,
                filterable: false,
                sortable: false,
            }));
        }
        return columns;
    }, [type, isFreeTier]);

    return (
        <DataGridPro
            data-cy='games-table'
            columns={columns}
            rows={data}
            pageSizeOptions={isFreeTier ? [10] : [5, 10, 25]}
            paginationModel={
                isFreeTier
                    ? { page: 0, pageSize: 10 }
                    : { page: data.length > 0 ? page : 0, pageSize }
            }
            onPaginationModelChange={onPaginationModelChange}
            loading={request.isLoading()}
            autoHeight
            rowHeight={70}
            onRowClick={onClickRow}
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
            slotProps={{
                row: {
                    onContextMenu: contextMenu.open,
                },
            }}
            pagination
        />
    );
}
