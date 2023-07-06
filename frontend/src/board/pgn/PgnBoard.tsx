import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Chess, Move } from '@jackstenglein/chess';
import { Box, Stack } from '@mui/material';

import Board, {
    BoardApi,
    BoardConfig,
    PrimitiveMove,
    onMoveFunc,
    reconcile,
} from '../Board';
import PgnText from './PgnText';
import { Color } from 'chessground/types';
import PlayerHeader from './PlayerHeader';
import Tools from './Tools';

type CurrentMoveContextType = {
    move: Move | null;
    setMove: (m: Move | null) => void;
};

export const CurrentMoveContext = createContext<CurrentMoveContextType>(null!);

export function useCurrentMove() {
    return useContext(CurrentMoveContext);
}

interface BoardDisplayProps {
    config?: BoardConfig;
    board?: BoardApi;
    chess?: Chess;
    showPlayerHeaders: boolean;
    startOrientation: Color;
    onInitialize: (board: BoardApi, chess: Chess) => void;
    onMove: onMoveFunc;
    onClickMove: (move: Move | null) => void;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({
    config,
    board,
    chess,
    showPlayerHeaders,
    startOrientation,
    onInitialize,
    onMove,
    onClickMove,
}) => {
    const [orientation, setOrientation] = useState<Color>(startOrientation);

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
            setOrientation(board.state.orientation);
        }
    }, [board, setOrientation]);

    const onFirstMove = () => {
        onClickMove(null);
    };

    const onPreviousMove = () => {
        if (chess) {
            onClickMove(chess.previousMove());
        }
    };

    const onNextMove = () => {
        if (chess) {
            onClickMove(chess.nextMove());
        }
    };

    const onLastMove = () => {
        if (chess) {
            onClickMove(chess.lastMove());
        }
    };

    return (
        <Box
            gridArea='board'
            sx={{
                width: 1,
            }}
        >
            <Stack>
                {showPlayerHeaders && (
                    <PlayerHeader
                        type='header'
                        orientation={orientation}
                        pgn={chess?.pgn}
                    />
                )}

                <Box
                    sx={{
                        aspectRatio: 1,
                        width: 1,
                    }}
                >
                    <Board config={config} onInitialize={onInitialize} onMove={onMove} />
                </Box>

                {showPlayerHeaders && (
                    <PlayerHeader
                        type='footer'
                        orientation={orientation}
                        pgn={chess?.pgn}
                    />
                )}

                <Tools
                    onFirstMove={onFirstMove}
                    onPreviousMove={onPreviousMove}
                    onNextMove={onNextMove}
                    onLastMove={onLastMove}
                    toggleOrientation={toggleOrientation}
                />
            </Stack>
        </Box>
    );
};

interface PgnBoardProps {
    pgn: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
}

const PgnBoard: React.FC<PgnBoardProps> = ({
    pgn,
    showPlayerHeaders = true,
    startOrientation = 'white',
}) => {
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
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            console.log('from: ', primMove.orig);
            console.log('to: ', primMove.dest);
            console.log('promotion: ', primMove.promotion);
            const move = chess.move({
                from: primMove.orig,
                to: primMove.dest,
                promotion: primMove.promotion,
            });
            reconcile(chess, board);
            setMove(move);
        },
        [setMove]
    );

    const onInitialize = useCallback(
        (board: BoardApi, chess: Chess) => {
            setBoard(board);
            setChess(chess);
        },
        [setBoard, setChess]
    );

    const onClickMove = useCallback(
        (move: Move | null) => {
            chess?.seek(move);
            reconcile(chess, board);
            setMove(move);
        },
        [chess, board, setMove]
    );

    return (
        <Box
            sx={{
                gridArea: 'pgn',
                display: 'grid',
                width: 1,
                gridTemplateRows: {
                    xs: 'auto var(--gap) minmax(auto, 400px)',
                    md: 'calc(var(--board-size) + var(--tools-height) + 8px + 2 * var(--player-header-height))',
                },
                gridTemplateColumns: {
                    xs: '1fr',
                    md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                },
                gridTemplateAreas: {
                    xs: '"board" "." "coach"',
                    md: '". board . coach ."',
                },
            }}
        >
            <CurrentMoveContext.Provider value={{ move, setMove }}>
                <BoardDisplay
                    config={{
                        pgn,
                        orientation: startOrientation,
                    }}
                    board={board}
                    chess={chess}
                    showPlayerHeaders={showPlayerHeaders}
                    startOrientation={startOrientation}
                    onInitialize={onInitialize}
                    onMove={onMove}
                    onClickMove={onClickMove}
                />

                {board && chess && (
                    <>
                        <Stack gridArea='coach' height={1} sx={{ overflowY: 'auto' }}>
                            <PgnText pgn={chess.pgn} onClickMove={onClickMove} />
                        </Stack>
                    </>
                )}
            </CurrentMoveContext.Provider>
        </Box>
    );
};

export default PgnBoard;
