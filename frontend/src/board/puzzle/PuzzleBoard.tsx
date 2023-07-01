import { useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Chess, Move } from '@jackstenglein/chess';

import HintSection from './HintSection';
import Board, { BoardApi, reconcile, toColor, toDests, toShapes } from '../Board';
import { CurrentMoveContext } from '../pgn/PgnBoard';
import { Key } from 'chessground/types';

export enum Status {
    WaitingForMove,
    IncorrectMove,
    CorrectMove,
    Complete,
}

interface PuzzleBoardProps {
    pgn: string;
    coachUrl?: string;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({ pgn, coachUrl }) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const [status, setStatus] = useState(Status.WaitingForMove);
    const [move, setMove] = useState<Move | null>(null);
    const [lastCorrectMove, setLastCorrectMove] = useState<Move | null>(null);

    const onRestart = (board: BoardApi, chess: Chess) => {
        chess.loadPgn(pgn);
        chess.seek(null);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            orientation: toColor(chess),
            lastMove: [],
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
            drawable: {
                shapes: toShapes(chess),
            },
        });
        setBoard(board);
        setChess(chess);
        setStatus(Status.WaitingForMove);
        setMove(null);
        setLastCorrectMove(null);
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
                drawable: {
                    shapes: toShapes(chess),
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
            drawable: {
                shapes: toShapes(chess),
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
            drawable: {
                shapes: toShapes(chess),
            },
        });
        setStatus(Status.WaitingForMove);
        setMove(lastCorrectMove);
    };

    const onComplete = (board: BoardApi, chess: Chess) => {
        board.set({
            fen: chess.fen(),
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
                events: {
                    after: (from: Key, to: Key) => {
                        chess.move({ from, to });
                        reconcile(chess, board);
                        setMove(chess.currentMove());
                    },
                },
            },
            drawable: {
                shapes: toShapes(chess),
            },
        });
        setStatus(Status.Complete);
        setMove(chess.currentMove());
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                px: '0 !important',
                justifyContent: 'start',
                '--gap': '16px',
                '--site-header-height': '80px',
                '--site-header-margin': '60px',
                '--player-header-height': '0px',
                '--toc-width': '21vw',
                '--coach-width': '400px',
                '--tools-height': '0px',
                '--board-width':
                    'calc(100vw - var(--coach-width) - 60px - var(--toc-width))',
                '--board-height':
                    'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 2 * var(--player-header-height))',
                '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    alignItems: 'end',
                    gridTemplateRows: {
                        xs: 'auto auto var(--gap) minmax(auto, 400px)',
                        md: 'auto calc(var(--board-size) + var(--tools-height) + 2 * var(--player-header-height))',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"header" "board" "." "coach"',
                        md: '"header . . ." "board . coach ."',
                    },
                }}
            >
                {board && chess && (
                    <Typography
                        variant='subtitle2'
                        color='text.secondary'
                        gridArea='header'
                    >
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
                    <Board onInitialize={onRestart} onMove={onMove} />
                </Box>
                {board && chess && (
                    <Stack
                        gridArea='coach'
                        height={1}
                        justifyContent={{ xs: 'start', sm: 'flex-end' }}
                        spacing={2}
                    >
                        <CurrentMoveContext.Provider value={{ move, setMove }}>
                            <HintSection
                                status={status}
                                move={move}
                                board={board}
                                chess={chess}
                                coachUrl={coachUrl}
                                onNext={onNext}
                                onRetry={onRetry}
                                onRestart={onRestart}
                            />
                        </CurrentMoveContext.Provider>
                    </Stack>
                )}
            </Box>
        </Container>
    );
};

export default PuzzleBoard;
