import { useFreeTier } from '@/auth/Auth';
import { CustomPagination } from '@/components/ui/CustomPagination';
import { GameInfo } from '@/database/game';
import { DataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { PaginationResult } from '@/hooks/usePagination';
import {
    DataGridPro,
    GridColDef,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useMemo } from 'react';
import {
    formatMoves,
    formatPublishedAt,
    getPublishedAt,
    RenderCohort,
    RenderOwner,
    RenderPlayersCell,
    RenderResult,
} from './GameListItem';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 65,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderCohort(params.row),
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
        minWidth: 150,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderOwner(params.row),
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
        valueGetter: (_value, row) => formatMoves(row.headers?.PlyCount),
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
    {
        field: 'publishedAt',
        headerName: 'Publish Date',
        valueGetter: (_value, row) => getPublishedAt(row),
        valueFormatter: formatPublishedAt,
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
