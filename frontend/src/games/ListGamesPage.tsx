import { Button, Container, Divider, Grid, Stack } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridPaginationModel,
    GridRowParams,
} from '@mui/x-data-grid';

import { GameInfo } from '../database/game';
import { RenderPlayers, RenderResult } from './GameListItem';
import { RequestSnackbar } from '../api/Request';
import { useNavigate } from 'react-router-dom';
import SearchFilters from './SearchFilters';

import { usePagination } from './pagination';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 115,
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (params) => ({
            white: `${params.row.headers.White} (${params.row.headers.WhiteElo ?? '??'})`,
            black: `${params.row.headers.Black} (${params.row.headers.BlackElo ?? '??'})`,
        }),
        renderCell: RenderPlayers,
        flex: 1,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (params) => params.row.headers.Result,
        renderCell: RenderResult,
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'moves',
        headerName: 'Moves',
        valueGetter: (params) =>
            params.row.headers.PlyCount
                ? Math.ceil(parseInt(params.row.headers.PlyCount) / 2)
                : '?',
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'date',
        headerName: 'Date',
        width: 115,
        align: 'right',
        headerAlign: 'right',
    },
];

const ListGamesPage = () => {
    const navigate = useNavigate();

    const { request, data, rowCount, page, pageSize, setPage, setPageSize, onSearch } =
        usePagination(null, 0, 10);

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `${params.row.cohort.replaceAll('+', '%2B')}/${params.row.id.replaceAll(
                '?',
                '%3F'
            )}`
        );
    };

    const setPaginationModel = ({ page, pageSize }: GridPaginationModel) => {
        setPage(page);
        setPageSize(pageSize);
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Grid container spacing={5} wrap='wrap-reverse'>
                <Grid item xs={12} md={9} lg={8}>
                    <DataGrid
                        columns={gameTableColumns}
                        rows={data}
                        rowCount={rowCount}
                        pageSizeOptions={[5, 10, 25]}
                        paginationModel={{ page, pageSize }}
                        onPaginationModelChange={setPaginationModel}
                        paginationMode='server'
                        loading={request.isLoading()}
                        autoHeight
                        rowHeight={70}
                        onRowClick={onClickRow}
                    />
                </Grid>

                <Grid item xs={12} md={3} lg={4} pr={2}>
                    <Stack spacing={4}>
                        <Button variant='contained' onClick={() => navigate('submit')}>
                            Submit a Game
                        </Button>

                        <Divider />

                        <SearchFilters
                            isLoading={request.isLoading()}
                            onSearch={onSearch}
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ListGamesPage;
