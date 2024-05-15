import { Container, Link, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid-pro';
import { useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { RequestSnackbar } from '../../api/Request';
import { isValidDate } from '../../calendar/eventEditor/useEventEditor';
import { GameInfo, GameReviewType } from '../../database/game';
import Avatar from '../../profile/Avatar';
import { RenderPlayers, RenderResult } from '../list/GameListItem';
import { CustomPagination } from '../list/ListGamesPage';
import { usePagination } from '../list/pagination';

export const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const columns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 115,
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
        flex: 0.5,
        minWidth: 150,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            if (params.row.ownerDisplayName === '') {
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
        valueGetter: (params) => ({
            white: `${params.row.headers.White} (${params.row.headers.WhiteElo ?? '??'})`,
            black: `${params.row.headers.Black} (${params.row.headers.BlackElo ?? '??'})`,
        }),
        renderCell: RenderPlayers,
        flex: 1,
        minWidth: 150,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (params) => params.row.headers.Result,
        renderCell: RenderResult,
        align: 'center',
        headerAlign: 'center',
        width: 75,
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
        width: 75,
    },
    {
        field: 'date',
        headerName: 'Date Played',
        width: 130,
        align: 'right',
        headerAlign: 'right',
    },
    {
        field: 'reviewRequestedAt',
        headerName: 'Date Requested',
        width: 145,
        align: 'right',
        headerAlign: 'right',
        valueFormatter: (params: GridValueFormatterParams<string>) => {
            return params.value.split('T')[0].replaceAll('-', '.');
        },
    },
    {
        field: 'review.type',
        headerName: 'Review Type',
        align: 'center',
        headerAlign: 'center',
        width: 120,
        valueGetter: (params: GridValueGetterParams<GameInfo>) => {
            if (!params.row.review) {
                return '';
            }
            switch (params.row.review.type) {
                case GameReviewType.Quick:
                    return 'Quick';
                case GameReviewType.Deep:
                    return 'Deep Dive';
            }
        },
    },
    {
        field: 'deadline',
        headerName: 'Deadline',
        align: 'center',
        headerAlign: 'center',
        valueGetter: (params: GridValueGetterParams<GameInfo>) => {
            const d = new Date(params.row.reviewRequestedAt || '');
            if (!isValidDate(d)) {
                return '';
            }
            return new Date(d.getTime() + ONE_WEEK)
                .toISOString()
                .split('T')[0]
                .replaceAll('-', '.');
        },
    },
];

const ReviewQueuePage = () => {
    const navigate = useNavigate();
    const api = useApi();
    const search = useCallback(
        (startKey: string) => api.listGamesForReview(startKey),
        [api],
    );

    const { request, data, rowCount, page, pageSize, hasMore, setPage, setPageSize } =
        usePagination(search, 0, 10);

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `/games/${params.row.cohort.replaceAll('+', '%2B')}/${params.row.id.replaceAll(
                '?',
                '%3F',
            )}`,
        );
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Typography color='text.secondary' mb={3}>
                These games will be reviewed by one of the senseis on a future{' '}
                <Link
                    href='https://www.twitch.tv/chessdojolive'
                    target='_blank'
                    rel='noreferrer'
                >
                    Twitch stream
                </Link>
                . To submit your <strong>annotated</strong> game for review, check the
                settings tab on your game.
            </Typography>

            <DataGridPro
                columns={columns}
                rows={data}
                rowCount={rowCount}
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page: data.length > 0 ? page : 0, pageSize }}
                onPaginationModelChange={onPaginationModelChange}
                loading={request.isLoading()}
                autoHeight
                rowHeight={70}
                onRowClick={onClickRow}
                sx={{ width: 1 }}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: 'reviewRequestedAt',
                                sort: 'asc',
                            },
                        ],
                    },
                }}
                pagination
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
            />
        </Container>
    );
};

export default ReviewQueuePage;
