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
    RenderGameResultStack,
    RenderOwner,
    RenderPlayersCell,
    RenderRatingHeader,
    RenderTimeControl,
} from './GameListItem';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderCohort(params.row),
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (_value, row) =>
            `${row.headers.White} (${row.headers.WhiteElo}) - ${row.headers.Black} (${row.headers.BlackElo})`,
        renderCell: RenderPlayersCell,
        minWidth: 150,
        flex: 1,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (_value, row) => row.headers?.Result,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <RenderGameResultStack result={params.row.headers.Result} />
        ),
        width: 50,
    },
    {
        field: 'whiteRating',
        renderHeader: () => <RenderRatingHeader white={true} />,
        valueGetter: (_value, row) => Number(row.headers?.WhiteElo),
        headerAlign: 'center',
        align: 'center',
        width: 75,
    },
    {
        field: 'blackRating',
        renderHeader: () => <RenderRatingHeader white={false} />,
        valueGetter: (_value, row) => Number(row.headers?.BlackElo),
        headerAlign: 'center',
        align: 'center',
        width: 75,
    },
    {
        field: 'timeControl',
        headerName: 'Time',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderTimeControl({ timeControl: params.row.headers.TimeControl }),
        width: 75,
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
        flex: 1,
    },
    {
        field: 'moves',
        headerName: 'Moves',
        valueGetter: (_value, row) => formatMoves(row.headers?.PlyCount),
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
];

interface GameTableProps {
    pagination: PaginationResult;
    onPaginationModelChange: (model: GridPaginationModel) => void;
    onClickRow: (params: GridRowParams<GameInfo>) => void;
    contextMenu: DataGridContextMenu;
    limitFreeTier?: boolean;
    columns?: GridColDef<GameInfo>[];
}

export default function GameTable({
    pagination,
    onPaginationModelChange,
    onClickRow,
    contextMenu,
    limitFreeTier,
    columns,
}: GameTableProps) {
    const freeTierLimited = useFreeTier() && limitFreeTier;
    const { data, request, page, pageSize, rowCount, hasMore, setPage } = pagination;

    const transformedColumns = useMemo(() => {
        let transformedColumns = columns ?? gameTableColumns;
        if (freeTierLimited) {
            transformedColumns = transformedColumns.map((col) => ({
                ...col,
                filterable: false,
                sortable: false,
            }));
        }
        return transformedColumns;
    }, [freeTierLimited, columns]);

    return (
        <DataGridPro
            data-cy='games-table'
            columns={transformedColumns}
            rows={data}
            pageSizeOptions={freeTierLimited ? [10] : [5, 10, 25]}
            paginationModel={
                freeTierLimited
                    ? { page: 0, pageSize: 10 }
                    : { page: data.length > 0 ? page : 0, pageSize }
            }
            onPaginationModelChange={onPaginationModelChange}
            loading={request.isLoading()}
            autoHeight
            sx={{ width: 1 }}
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
