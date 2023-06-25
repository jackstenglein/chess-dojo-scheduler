import { useState } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { Chess, Move } from '@jackstenglein/chess';

import HintSection from './HintSection';
import Board, { BoardApi, toColor, toDests } from '../Board';

export enum Status {
    WaitingForMove,
    IncorrectMove,
    CorrectMove,
    Complete,
}

interface PuzzleBoardProps {
    pgn: string;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ pgn }) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const [status, setStatus] = useState(Status.WaitingForMove);
    const [move, setMove] = useState<Move | null>(null);
    const [lastCorrectMove, setLastCorrectMove] = useState<Move | null>(null);

    const onInitialize = (board: BoardApi, chess: Chess) => {
        chess.loadPgn(pgn);
        chess.seek(null);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
                events: {
                    after: onMove(board, chess),
                },
                free: false,
            },
            premovable: {
                enabled: false,
            },
        });
        setBoard(board);
        setChess(chess);
    };

    const onMove = (board: BoardApi, chess: Chess) => {
        return (from: string, to: string) => {
            if (chess.isMainline({ from, to })) {
                chess.seek(chess.nextMove());
                if (
                    chess.lastMove() === chess.currentMove() ||
                    chess.hasNagInRange(10, 140)
                ) {
                    return onComplete(board, chess);
                }
                setStatus(Status.CorrectMove);
            } else {
                chess.move({ from, to });
                setStatus(Status.IncorrectMove);
            }

            board.set({
                fen: chess.fen(),
                turnColor: toColor(chess),
                movable: {
                    color: undefined,
                },
            });

            setMove(chess.currentMove());
        };
    };

    const onNext = (board: BoardApi, chess: Chess) => {
        const nextMove = chess.nextMove();
        if (!nextMove) {
            return onComplete(board, chess);
        }
        chess.seek(nextMove);
        if (chess.lastMove() === nextMove || chess.hasNagInRange(10, 140, nextMove)) {
            return onComplete(board, chess);
        }

        board.move(nextMove.from, nextMove.to);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
            },
        });
        setStatus(Status.WaitingForMove);
        setMove(nextMove);
        setLastCorrectMove(nextMove);
    };

    const onRetry = (board: BoardApi, chess: Chess) => {
        chess.seek(lastCorrectMove);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            lastMove: lastCorrectMove ? [lastCorrectMove.from, lastCorrectMove.to] : [],
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
            },
        });
        setStatus(Status.WaitingForMove);
        setMove(lastCorrectMove);
    };

    const onComplete = (board: BoardApi, chess: Chess) => {
        board.set({
            fen: chess.fen(),
            movable: {
                color: undefined,
                dests: undefined,
            },
        });
        setStatus(Status.Complete);
        setMove(chess.currentMove());
    };

    const onRestart = (board: BoardApi, chess: Chess) => {
        chess.seek(null);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            lastMove: [],
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
            },
        });
        setStatus(Status.WaitingForMove);
        setMove(null);
        setLastCorrectMove(null);
    };

    return (
        <Grid container mt={1} rowGap={2}>
            {board && chess && (
                <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {chess.pgn.header.tags.White} vs {chess.pgn.header.tags.Black}
                    </Typography>
                </Grid>
            )}
            <Grid item xs={12} sm={8} md={8}>
                <Box
                    sx={{
                        aspectRatio: 1,
                        minHeight: '336px',
                        maxWidth: '716px',
                        width: 1,
                    }}
                >
                    <Board onInitialize={onInitialize} onMove={onMove} />
                </Box>
            </Grid>
            {board && chess && (
                <Grid item xs={12} sm={4} md={4}>
                    <Stack height={1} justifyContent='flex-end'>
                        <HintSection
                            status={status}
                            move={move}
                            board={board}
                            chess={chess}
                            onNext={onNext}
                            onRetry={onRetry}
                            onRestart={onRestart}
                        />
                    </Stack>
                </Grid>
            )}
        </Grid>
    );
};

export default PuzzleBoard;
