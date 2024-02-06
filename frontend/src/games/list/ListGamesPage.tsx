import { Button, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
    GridValueFormatterParams,
} from '@mui/x-data-grid-pro';

import { GameInfo } from '../../database/game';
import { RenderPlayers, RenderResult } from './GameListItem';
import { RequestSnackbar } from '../../api/Request';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import SearchFilters from './SearchFilters';

import { usePagination } from './pagination';
import ListGamesTutorial from './ListGamesTutorial';
import { useFreeTier } from '../../auth/Auth';
import { useMemo, useState } from 'react';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';
import UpsellAlert from '../../upsell/UpsellAlert';
import UpsellPage from '../../upsell/UpsellPage';
import Avatar from '../../profile/Avatar';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 115,
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
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
        field: 'publishedAt',
        headerName: 'Publish Date',
        valueGetter: (params) => {
            return (
                params.row.publishedAt ||
                params.row.createdAt ||
                params.row.id.split('_')[0]
            );
        },
        valueFormatter: (params: GridValueFormatterParams<string>) => {
            return params.value.split('T')[0].replaceAll('-', '.');
        },
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

const ListGamesPage = () => {
    const navigate = useNavigate();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [upsellAction, setUpsellAction] = useState('');
    const type = useSearchParams()[0].get('type') || '';

    const columns = useMemo(() => {
        if (type === 'owner') {
            return gameTableColumns.filter((c) => c.field !== 'owner');
        }
        return gameTableColumns;
    }, [type]);

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

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.page !== page) {
            setPage(model.page);
        }
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onSubmit = () => {
        navigate('submit');
    };

    const onDownloadDatabase = () => {
        setUpsellAction(RestrictedAction.DownloadDatabase);
        setUpsellDialogOpen(true);
    };

    if (isFreeTier && type === 'player') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.SearchDatabase}
            />
        );
    }
    if (isFreeTier && type === 'position') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.DatabaseExplorer}
            />
        );
    }

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            {isFreeTier && (
                <>
                    <Stack alignItems='center' mb={5}>
                        <UpsellAlert>
                            To avoid unfair preparation against Dojo members, free-tier
                            users have limited access to the Dojo Database. Upgrade your
                            account to view the full Database.
                        </UpsellAlert>
                    </Stack>
                    <UpsellDialog
                        open={upsellDialogOpen}
                        onClose={setUpsellDialogOpen}
                        currentAction={upsellAction}
                    />
                </>
            )}

            <Grid container spacing={5} wrap='wrap-reverse'>
                <Grid item xs={12} md={9} lg={8}>
                    <DataGridPro
                        data-cy='games-table'
                        columns={columns}
                        rows={isFreeTier ? data.slice(0, 10) : data}
                        rowCount={isFreeTier ? Math.min(rowCount, 10) : rowCount}
                        pageSizeOptions={[5, 10, 25]}
                        paginationModel={{ page: data.length > 0 ? page : 0, pageSize }}
                        onPaginationModelChange={onPaginationModelChange}
                        paginationMode='server'
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
                        pagination
                    />
                </Grid>

                <Grid item xs={12} md={3} lg={4} pr={2}>
                    <Stack spacing={4}>
                        <Button
                            data-cy='submit-game-button'
                            id='submit-game-button'
                            variant='contained'
                            onClick={onSubmit}
                        >
                            Submit a Game
                        </Button>

                        <Divider />

                        <SearchFilters
                            isLoading={request.isLoading()}
                            onSearch={onSearch}
                        />

                        <Typography
                            data-cy='download-database-button'
                            id='download-full-database'
                            variant='caption'
                            alignSelf='end'
                        >
                            <Link
                                href={
                                    isFreeTier
                                        ? undefined
                                        : 'https://chess-dojo-prod-game-database.s3.amazonaws.com/dojo_database.zip'
                                }
                                target='_blank'
                                rel='noreferrer'
                                onClick={isFreeTier ? onDownloadDatabase : undefined}
                            >
                                Download full database (updated every 24 hours)
                            </Link>
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>

            <ListGamesTutorial />
        </Container>
    );
};

export default ListGamesPage;
