import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
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
            orientation: toColor(chess),
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
        <Box
            sx={{
                display: 'grid',
                width: 1,
                '--zoom': 85,
                '--site-header-height': '80px',
                '--site-header-margin': 0,
                '--board-scale': 'calc((var(--zoom) / 100) * 0.75 + 0.25)',
                '--gap': '16px',
                '--main-margin': '1vw',
                '--col2-board-width':
                    'calc(min(calc( 100vw - 16px - 260px ), calc(100vh - 80px - 1rem)) * var(--board-scale))',
                gridTemplateRows: {
                    xs: 'auto auto var(--gap) minmax(20em, 30vh)',
                    sm: 'fit-content(0)',
                },
                gridTemplateColumns: {
                    xs: undefined,
                    sm: 'var(--col2-board-width) var(--gap) minmax(240px, 400px)',
                },
                gridTemplateAreas: {
                    xs: '"header" "board" "gap" "coach"',
                    sm: '"header header header" "board gap coach"',
                },
            }}
        >
            {board && chess && (
                <Typography gridArea='header' variant='subtitle2' color='text.secondary'>
                    {chess.pgn.header.tags.White} vs {chess.pgn.header.tags.Black}
                </Typography>
            )}
            <Box
                gridArea='board'
                sx={{
                    aspectRatio: 1,
                    width: 1,
                }}
            >
                <Board onInitialize={onInitialize} onMove={onMove} />
            </Box>
            {board && chess && (
                <Stack
                    gridArea='coach'
                    height={1}
                    justifyContent={{ xs: 'start', sm: 'flex-end' }}
                >
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
            )}
        </Box>
    );
};

export default PuzzleBoard;

/*


return (
        <Grid container mt={1} rowGap={2}>
            {board && chess && (
                <Grid item xs={12}>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {chess.pgn.header.tags.White} vs {chess.pgn.header.tags.Black}
                    </Typography>
                </Grid>
            )}
            <Grid item xs={12} sm='auto'>
                <Box
                    sx={{
                        aspectRatio: 1,
                        minHeight: '336px',
                        minWidth: '336px',
                        maxWidth: 'calc(min(716px, 70vh))',
                    }}
                >
                    <Board onInitialize={onInitialize} onMove={onMove} />
                </Box>
            </Grid>
            {board && chess && (
                <Grid item xs={12} sm='auto'>
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
 */
