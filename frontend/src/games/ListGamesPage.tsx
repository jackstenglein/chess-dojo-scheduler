import { useCallback, useEffect, useState } from 'react';
import {
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { AxiosResponse } from 'axios';

import { GameInfo } from '../database/game';
import { RenderPlayers, RenderResult } from './GameListItem';
import { useApi } from '../api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import { useNavigate } from 'react-router-dom';
import { dojoCohorts } from '../database/user';
import { useAuth } from '../auth/Auth';
import { LoadingButton } from '@mui/lab';
import { ListGamesResponse } from '../api/gameApi';

const columns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 115,
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (params) => ({
            white: `${params.row.white} (${params.row.headers.WhiteElo ?? '??'})`,
            black: `${params.row.black} (${params.row.headers.BlackElo ?? '??'})`,
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

type SearchFunc = (startKey: string) => Promise<AxiosResponse<ListGamesResponse, any>>;

function usePagination(
    initialSearchFunc: SearchFunc,
    initialPage: number,
    initialPageSize: number
) {
    const request = useRequest();

    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [games, setGames] = useState<GameInfo[]>([]);
    const [startKey, setStartKey] = useState<string | undefined>('');
    const [searchFunc, setSearchFunc] = useState<SearchFunc>(() => initialSearchFunc);

    const onChangePage = (newPage: number) => {
        request.reset();
        setPage(newPage);
    };

    const onSearch = (searchFunc: SearchFunc) => {
        request.reset();
        setPage(0);
        setGames([]);
        setStartKey('');
        setSearchFunc(() => searchFunc);
    };

    useEffect(() => {
        // We have already fetched this page of data and don't need to refetch
        if (games.length > page * pageSize) {
            return;
        }

        // There are no more pages to fetch
        if (startKey === undefined) {
            return;
        }

        // The request is already sent and we don't want to duplicate it
        if (request.isLoading() || request.status === RequestStatus.Failure) {
            return;
        }

        // We need to fetch the next page
        console.log('Fetching page: ', page);
        request.onStart();

        searchFunc(startKey)
            .then((response) => {
                console.log('ListGamesByCohort: ', response);
                request.onSuccess();
                setGames(games.concat(response.data.games));
                setStartKey(response.data.lastEvaluatedKey);
            })
            .catch((err) => {
                console.error('ListGamesByCohort: ', err);
                request.onFailure(err);
            });
    }, [page, pageSize, games, startKey, searchFunc, request]);

    let rowCount = games.length;
    if (startKey !== undefined) {
        rowCount += pageSize;
    }

    let data: GameInfo[] = [];
    if (games.length > page * pageSize) {
        data = games.slice(page * pageSize, page * pageSize + pageSize);
    }

    return {
        page,
        pageSize,
        data,
        request,
        rowCount,
        setPage: onChangePage,
        setPageSize,
        onSearch,
    };
}

const ListGamesPage = () => {
    const user = useAuth().user!;
    const navigate = useNavigate();
    const api = useApi();

    const [cohort, setCohort] = useState(user.dojoCohort);
    const searchByCohort = useCallback(
        (startKey: string) => api.listGamesByCohort(cohort, startKey),
        [cohort, api]
    );

    const { request, data, rowCount, page, pageSize, setPage, setPageSize, onSearch } =
        usePagination(searchByCohort, 0, 5);

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `${params.row.cohort.replaceAll('+', '%2B')}/${params.row.id.replaceAll(
                '?',
                '%3F'
            )}`
        );
    };

    const onSearchByCohort = () => {
        onSearch(searchByCohort);
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Grid container spacing={5} wrap='wrap-reverse'>
                <Grid item xs={12} md={9} lg={8}>
                    <DataGrid
                        columns={columns}
                        rows={data}
                        rowCount={rowCount}
                        rowsPerPageOptions={[5, 10, 25]}
                        pageSize={pageSize}
                        paginationMode='server'
                        onPageChange={(page) => setPage(page)}
                        onPageSizeChange={(size) => setPageSize(size)}
                        page={page}
                        loading={request.isLoading()}
                        autoHeight
                        rowHeight={70}
                        onRowClick={onClickRow}
                    />
                </Grid>

                <Grid item xs={12} md={3} lg={4} pr={2}>
                    <Stack spacing={2}>
                        <Typography variant='subtitle1'>Search by Cohort</Typography>
                        <FormControl>
                            <InputLabel>Cohort</InputLabel>
                            <Select
                                value={cohort}
                                label='Cohort'
                                onChange={(e) => setCohort(e.target.value)}
                            >
                                {dojoCohorts.map((c) => (
                                    <MenuItem key={c} value={c}>
                                        {c}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <LoadingButton
                            variant='contained'
                            loading={request.isLoading()}
                            onClick={onSearchByCohort}
                        >
                            Search
                        </LoadingButton>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ListGamesPage;
