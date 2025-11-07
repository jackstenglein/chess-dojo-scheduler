'use client';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import Board from '@/board/Board';
import { formatTime } from '@/board/pgn/boardTools/underboard/clock/ClockUsage';
import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import { DrawIcon, LoseIcon, WinIcon } from '@/components/games/list/GameListItem';
import { User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { GetPuzzleHistoryResponse } from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import {
    Box,
    Container,
    Fade,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

export function PuzzleHistory() {
    const { user, status } = useAuth();
    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }
    if (user) {
        return <UserPuzzleHistory user={user} />;
    }
}

function UserPuzzleHistory({ user }: { user: User }) {
    const api = useApi();
    const request = useRequest<GetPuzzleHistoryResponse>();
    const { user: viewer } = useAuth();
    // const router = useRouter();

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getPuzzleHistory({ username: user.username })
                .then((response) => {
                    console.log(`getPuzzleHistory: `, response.data);
                    request.onSuccess(response.data);
                })
                .catch((err: unknown) => {
                    console.error(`getPuzzleHistory: `, err);
                    request.onFailure(err);
                });
        }
    }, [user, request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    // const onClickRow = (id: string) => {
    //     router.push(`/puzzles/${id}`);
    // };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <Typography variant='h5' sx={{ mb: 3 }}>
                Puzzle History for {user.displayName}
            </Typography>

            <Paper elevation={3} sx={{ width: 1, borderRadius: 1, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>ID</TableCell>
                                <TableCell align='center'>Puzzle Rating</TableCell>
                                <TableCell align='center'>Time Spent</TableCell>
                                <TableCell>Result</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {request.data?.history
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((h) => (
                                    <Tooltip
                                        key={h.createdAt}
                                        arrow
                                        placement='right'
                                        slots={{ transition: Fade }}
                                        title={
                                            <Box sx={{ width: 200, height: 200 }}>
                                                <Board
                                                    config={{
                                                        fen: h.fen,
                                                        viewOnly: true,
                                                        coordinates: false,
                                                        orientation:
                                                            h.fen.split(' ')[1] === 'w'
                                                                ? 'black'
                                                                : 'white',
                                                    }}
                                                />
                                            </Box>
                                        }
                                    >
                                        <TableRow
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            // onClick={() => onClickRow(h.id)}
                                        >
                                            <TableCell>
                                                {toDojoDateString(
                                                    new Date(h.createdAt),
                                                    viewer?.timezoneOverride,
                                                )}{' '}
                                                •{' '}
                                                {toDojoTimeString(
                                                    new Date(h.createdAt),
                                                    viewer?.timezoneOverride,
                                                    viewer?.timeFormat,
                                                )}
                                            </TableCell>
                                            <TableCell>{h.id}</TableCell>
                                            <TableCell align='center'>{h.puzzleRating}</TableCell>
                                            <TableCell align='center'>
                                                {formatTime(h.timeSpentSeconds)}
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color:
                                                        h.ratingChange > 0
                                                            ? 'success.main'
                                                            : h.ratingChange < 0
                                                              ? 'error.main'
                                                              : 'text.secondary',
                                                }}
                                            >
                                                <Stack direction='row' alignItems='center' gap={1}>
                                                    {h.result === 'win' ? (
                                                        <WinIcon />
                                                    ) : h.result === 'draw' ? (
                                                        <DrawIcon />
                                                    ) : (
                                                        <LoseIcon />
                                                    )}{' '}
                                                    {h.rated ? (
                                                        <>
                                                            {h.rating} ({h.ratingChange >= 0 && '+'}
                                                            {h.ratingChange})
                                                        </>
                                                    ) : (
                                                        'Unrated'
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    </Tooltip>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component='div'
                    count={request.data?.history.length ?? 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Container>
    );
}
