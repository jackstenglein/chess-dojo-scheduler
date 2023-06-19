import { Divider, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { GameInfo } from '../database/game';
import LoadingPage from '../loading/LoadingPage';
import { DataGrid, GridRowParams } from '@mui/x-data-grid';
import { gameTableColumns } from '../games/list/ListGamesPage';

const FeaturedGames = () => {
    const api = useApi();
    const request = useRequest<GameInfo[]>();
    const navigate = useNavigate();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listFeaturedGames()
                .then((games) => request.onSuccess(games))
                .catch((err) => {
                    console.error('listFeaturedGames: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    console.log('Games: ', request.data);

    const games = request.data ?? [];

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `/games/${params.row.cohort.replaceAll(
                '+',
                '%2B'
            )}/${params.row.id.replaceAll('?', '%3F')}`
        );
    };

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />

            <Stack>
                <Typography variant='h6'>Featured Games</Typography>
                <Divider />
            </Stack>

            {games.length === 0 ? (
                request.isLoading() ? (
                    <LoadingPage />
                ) : (
                    <Typography>No featured games in the past month</Typography>
                )
            ) : (
                <DataGrid
                    columns={gameTableColumns}
                    rows={games}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                page: 0,
                                pageSize: 10,
                            },
                        },
                    }}
                    autoHeight
                    rowHeight={70}
                    onRowClick={onClickRow}
                    sx={{ width: 1 }}
                />
            )}
        </Stack>
    );
};

export default FeaturedGames;
