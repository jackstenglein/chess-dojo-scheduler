import { useFreeTier } from '@/auth/Auth';
import { CustomPagination } from '@/components/ui/CustomPagination';
import { GameInfo } from '@/database/game';
import { DataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { PaginationResult } from '@/hooks/usePagination';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Tooltip, useMediaQuery, useTheme } from '@mui/material';
import {
    DataGridPro,
    DataGridProProps,
    GridColDef,
    GridColumnVisibilityModel,
    GridListColDef,
    GridRenderCellParams,
    GridRowParams,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarFilterButton,
    useGridApiRef,
} from '@mui/x-data-grid-pro';
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
    formatMoves,
    formatPublishedAt,
    getPublishedAt,
    getTimeControl,
    ListViewCell,
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
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => RenderCohort(params.row),
        align: 'center',
        headerAlign: 'center',
        width: 70,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (_value, row) => row.headers?.Result,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => <RenderGameResultStack result={params.row.headers.Result} />,
        width: 50,
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
        field: 'whiteRating',
        headerName: 'White Rating',
        renderHeader: () => <RenderRatingHeader white={true} />,
        valueGetter: (_value, row) => Number(row.headers?.WhiteElo) || '',
        headerAlign: 'center',
        align: 'center',
        width: 75,
    },
    {
        field: 'blackRating',
        headerName: 'Black Rating',
        renderHeader: () => <RenderRatingHeader white={false} />,
        valueGetter: (_value, row) => Number(row.headers?.BlackElo) || '',
        headerAlign: 'center',
        align: 'center',
        width: 75,
    },
    {
        field: 'timeControl',
        headerName: 'Time',
        renderCell: (params: GridRenderCellParams<GameInfo, string>) =>
            RenderTimeControl({ timeControl: params.row.headers.TimeControl }),
        valueGetter: (_, row) => getTimeControl({ timeControl: row.headers.TimeControl }),
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
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => RenderOwner(params.row),
        flex: 1,
    },
    {
        field: 'unlisted',
        headerName: 'Visibility',
        align: 'center',
        headerAlign: 'center',
        minWidth: 75,
        width: 75,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            if (params.row.unlisted) {
                return (
                    <Tooltip title='Unlisted'>
                        <VisibilityOff sx={{ color: 'text.secondary', height: 1 }} />
                    </Tooltip>
                );
            }
            return (
                <Tooltip title='Public'>
                    <Visibility sx={{ color: 'text.secondary', height: 1 }} />
                </Tooltip>
            );
        },
    },
];

const listColDef: GridListColDef<GameInfo> = {
    field: 'listColumn',
    renderCell: ListViewCell,
};

interface GameTableProps
    extends Omit<
        DataGridProProps<GameInfo>,
        | 'columns'
        | 'rows'
        | 'pagination'
        | 'columnVisibilityModel'
        | 'onColumnVisibilityModelChange'
    > {
    namespace: string;
    pagination: PaginationResult;
    contextMenu?: DataGridContextMenu;
    limitFreeTier?: boolean;
    columns?: GridColDef<GameInfo>[];
    defaultVisibility?: Record<string, boolean>;
    onRowClick?: (params: GridRowParams<GameInfo>, event: React.MouseEvent) => void;
}

export default function GameTable({
    namespace,
    pagination,
    onPaginationModelChange,
    onRowClick,
    contextMenu,
    limitFreeTier,
    columns,
    defaultVisibility,
    ...dataGridProps
}: GameTableProps) {
    const apiRef = useGridApiRef();
    const freeTierLimited = useFreeTier() && limitFreeTier;
    const { data, request, page, pageSize, rowCount, hasMore, setPage } = pagination;
    const [columnVisibility, setColumnVisibility] = useLocalStorage<GridColumnVisibilityModel>(
        `/GameTable/${namespace}/visibility`,
        {
            whiteRating: false,
            blackRating: false,
            unlisted: false,
            ...(defaultVisibility ?? {}),
        },
    );

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

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
    const isListView = dataGridProps.unstable_listView || isSmall;

    const getEstimatedRowHeight = useCallback(() => {
        if (isListView) {
            return 105;
        }
        const density = apiRef.current?.state?.density;
        switch (density) {
            case 'compact':
                return 50;
            case 'standard':
                return 65;
            case 'comfortable':
                return 75;
            default:
                return 65;
        }
    }, [isListView, apiRef]);

    const getRowHeight = useCallback(() => {
        if (isListView) {
            return 'auto';
        }
        const density = apiRef.current?.state?.density;
        switch (density) {
            case 'compact':
                return 50;
            case 'standard':
                return 65;
            case 'comfortable':
                return 75;
            default:
                return 65;
        }
    }, [isListView, apiRef]);

    return (
        <DataGridPro
            apiRef={apiRef}
            {...dataGridProps}
            data-cy='games-table'
            columns={transformedColumns}
            rows={data}
            pageSizeOptions={freeTierLimited ? [10] : [5, 10, 25]}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(model) => setColumnVisibility(model)}
            paginationModel={
                freeTierLimited
                    ? { page: 0, pageSize: 10 }
                    : { page: data.length > 0 ? page : 0, pageSize }
            }
            onPaginationModelChange={onPaginationModelChange}
            loading={request.isLoading()}
            autoHeight
            sx={{ width: 1 }}
            getRowHeight={getRowHeight}
            getEstimatedRowHeight={getEstimatedRowHeight}
            onRowClick={onRowClick}
            initialState={{
                density: 'standard',
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
                toolbar: isListView ? undefined : CustomGridToolbar,
            }}
            slotProps={
                contextMenu
                    ? {
                          row: {
                              onContextMenu: contextMenu.open,
                          },
                      }
                    : undefined
            }
            pagination
            unstable_listView={isListView}
            unstable_listColumn={dataGridProps.unstable_listColumn || listColDef}
        />
    );
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
