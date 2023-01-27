import { useCallback, useEffect, useState } from 'react';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
} from '@mui/material';

import { GameInfo } from '../database/game';
import GameListItem from './GameListItem';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

const ListGamesPage = () => {
    const api = useApi();
    const request = useRequest();

    const [games, setGames] = useState<GameInfo[]>([]);
    const [startKey, setStartKey] = useState<string | undefined>('');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchGames = useCallback(() => {
        if (startKey === undefined) {
            return;
        }

        api.listGamesByCohort('1100-1200', startKey)
            .then((response) => {
                console.log('ListGamesByCohort: ', response);
                request.onSuccess();
                setGames((g) => g.concat(response.data.games));
                setStartKey(response.data.lastEvaluatedKey);
            })
            .catch((err) => {
                console.error('ListGamesByCohort: ', err);
                request.onFailure(err);
            });
    }, [api, request, startKey]);

    useEffect(() => {
        if (!request.isSent()) {
            fetchGames();
        }
    }, [request, fetchGames]);

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Cohort</TableCell>
                        <TableCell>Players</TableCell>
                        <TableCell align='center'>Result</TableCell>
                        <TableCell align='center'>Moves</TableCell>
                        <TableCell align='right'>Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {games.map((game) => (
                        <GameListItem key={game.id} game={game} />
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            colSpan={5}
                            count={games.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            SelectProps={{
                                inputProps: {
                                    'aria-label': 'rows per page',
                                },
                                native: true,
                            }}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) =>
                                setRowsPerPage(parseInt(e.target.value))
                            }
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </Container>
    );
};

export default ListGamesPage;
