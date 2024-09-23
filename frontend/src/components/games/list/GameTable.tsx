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
    RenderTimeControl,
} from './GameListItem';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderCohort(params.row),
        width: 1,
    },
    {
        field: 'timeControl',
        headerName: 'Time',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderTimeControl({ timeControl: params.row.headers.TimeControl }),
        width: 1,
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (_value, row) =>
            `${row.headers.White} (${row.headers.WhiteElo}) - ${row.headers.Black} (${row.headers.BlackElo})`,
        renderCell: RenderPlayersCell,
        minWidth: 200,
        flex: 1,
    },
    {
        field: 'date',
        headerName: 'Played',
        align: 'right',
        headerAlign: 'right',
    },
    {
        field: 'publishedAt',
        headerName: 'Published',
        valueGetter: (_value, row) => getPublishedAt(row),
        valueFormatter: formatPublishedAt,
        align: 'right',
        headerAlign: 'right',
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderOwner(params.row),
    },
    {
        field: 'moves',
        headerName: 'Moves',
        valueGetter: (_value, row) => formatMoves(row.headers?.PlyCount),
        align: 'center',
        headerAlign: 'center',
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
            autosizeOnMount
        />
    );
}
