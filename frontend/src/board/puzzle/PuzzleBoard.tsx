import { useState } from 'react';
import { Box, Stack, SxProps, Theme, Typography } from '@mui/material';
import { Chess, Move } from '@jackstenglein/chess';

import HintSection from './HintSection';
import Board, { BoardApi, reconcile, toColor, toDests, toShapes } from '../Board';
import { ChessContext } from '../pgn/PgnBoard';
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
    sx?: SxProps<Theme>;
    hideHeader?: boolean;
    playBothSides?: boolean;
    onComplete: () => void;
    onNextPuzzle?: () => void;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
    pgn,
    coachUrl,
    sx,
    hideHeader = false,
    playBothSides = false,
    onComplete: onCompletePuzzle,
    onNextPuzzle,
}) => {
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
            const isCorrect = chess.isMainline({ from, to });
            if (isCorrect) {
                chess.seek(chess.nextMove());
                if (
                    chess.lastMove() === chess.currentMove() ||
                    chess.hasNagInRange(10, 140)
                ) {
                    return onComplete(board, chess);
                }
                setStatus(Status.CorrectMove);
                console.log('Setting last correct move: ', chess.currentMove());
                setLastCorrectMove(chess.currentMove());
            } else {
                chess.move({ from, to });
                setStatus(Status.IncorrectMove);
            }

            board.set({
                fen: chess.fen(),
                turnColor: toColor(chess),
                movable: {
                    color: isCorrect && playBothSides ? toColor(chess) : undefined,
                    dests: isCorrect && playBothSides ? toDests(chess) : undefined,
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
        console.log('Setting last correct move: ', nextMove);
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
        onCompletePuzzle();
    };

    return (
        <Box
            sx={
                sx || {
                    gridArea: 'pgn',
                    display: 'grid',
                    width: 1,
                    alignItems: 'end',
                    gridTemplateRows: {
                        xs: 'auto auto var(--gap) minmax(auto, 400px)',
                        md: 'auto calc(var(--board-size) + var(--tools-height))',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"header" "board" "." "coach"',
                        md: '"header . . ." "board gap coach ."',
                    },
                }
            }
        >
            {board && chess && !hideHeader && (
                <Typography variant='subtitle2' color='text.secondary' gridArea='header'>
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
                    <ChessContext.Provider value={{ chess }}>
                        <HintSection
                            status={status}
                            move={move}
                            board={board}
                            chess={chess}
                            coachUrl={coachUrl}
                            playBothSides={playBothSides}
                            onNext={onNext}
                            onRetry={onRetry}
                            onRestart={onRestart}
                            onNextPuzzle={onNextPuzzle}
                        />
                    </ChessContext.Provider>
                </Stack>
            )}
        </Box>
    );
};

export default PuzzleBoard;
