import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Chess, Move } from '@jackstenglein/chess';
import { Box, Stack } from '@mui/material';

import Board, { BoardApi, toColor, toDests } from '../Board';
import PgnText from './PgnText';
import { Key } from 'chessground/types';
import Tools from './Tools';

type CurrentMoveContextType = {
    currentMove: Move | null;
};

const CurrentMoveContext = createContext<CurrentMoveContextType>(null!);

export function useCurrentMove() {
    return useContext(CurrentMoveContext);
}

function reconcile(chess?: Chess, board?: BoardApi) {
    if (!chess || !board) {
        return;
    }

    const currentMove = chess.currentMove();
    board.set({
        fen: chess.fen(),
        turnColor: toColor(chess),
        lastMove: currentMove ? [currentMove.from, currentMove.to] : [],
        movable: {
            color: toColor(chess),
            dests: toDests(chess),
        },
    });
}

interface PgnBoardProps {
    pgn: string;
}

const PgnBoard: React.FC<PgnBoardProps> = ({ pgn }) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const [move, setMove] = useState<Move | null>(null);

    const onArrowKeys = useCallback(
        (event: KeyboardEvent) => {
            if (!chess || !board) {
                return;
            }

            if (event.key === 'ArrowRight') {
                const nextMove = chess.nextMove();
                if (nextMove !== null) {
                    chess.seek(nextMove);
                    reconcile(chess, board);
                    setMove(nextMove);
                }
            } else if (event.key === 'ArrowLeft') {
                const prevMove = chess.seek(chess.previousMove());
                reconcile(chess, board);
                setMove(prevMove);
            }
        },
        [board, chess]
    );

    useEffect(() => {
        window.addEventListener('keyup', onArrowKeys);
        return () => {
            window.removeEventListener('keyup', onArrowKeys);
        };
    }, [onArrowKeys]);

    const onMove = useCallback(
        (board: BoardApi, chess: Chess) => {
            return (from: Key, to: Key) => {
                const move = chess.move({ from, to });
                reconcile(chess, board);
                setMove(move);
            };
        },
        [setMove]
    );

    const onInitialize = useCallback(
        (board: BoardApi, chess: Chess) => {
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
        },
        [pgn, setBoard, setChess, onMove]
    );

    const onClickMove = useCallback(
        (move: Move) => {
            chess?.seek(move);
            reconcile(chess, board);
            setMove(move);
        },
        [chess, board, setMove]
    );

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
                '--header-height': '24px',
                '--col2-board-width':
                    'calc(min(calc( 100vw - 16px - 260px ), calc(100vh - 80px - 1rem)) * var(--board-scale))',
                '--tools-width':
                    'calc(max(200px, min(70vw - var(--col2-board-width) - var(--gap), 400px)))',
                gridTemplateRows: {
                    xs: 'auto auto auto var(--gap) auto minmax(20em, 30vh)',
                    sm: 'fit-content(0) var(--col2-board-width) fit-content(0)',
                },
                gridTemplateColumns: {
                    xs: undefined,
                    sm: 'var(--col2-board-width) var(--gap) var(--tools-width)',
                },
                gridTemplateAreas: {
                    xs: '"header" "board" "footer" "gap" "tools" "coach"',
                    sm: '"header gap ." "board gap coach" "footer gap tools"',
                },
            }}
        >
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
                <>
                    <Tools board={board} chess={chess} />
                    <CurrentMoveContext.Provider value={{ currentMove: move }}>
                        <Stack gridArea='coach' height={1}>
                            <PgnText pgn={chess.pgn} onClickMove={onClickMove} />
                        </Stack>
                    </CurrentMoveContext.Provider>
                </>
            )}
        </Box>
    );
};

export default PgnBoard;
