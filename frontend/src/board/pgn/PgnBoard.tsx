import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Chess, Move } from '@jackstenglein/chess';
import { Box, IconButton, Paper, Stack, Tooltip } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import FlipIcon from '@mui/icons-material/WifiProtectedSetup';

import Board, { BoardApi, toColor, toDests } from '../Board';
import PgnText from './PgnText';
import { Color, Key } from 'chessground/types';
import PlayerHeader from './PlayerHeader';

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

interface BoardDisplayProps {
    board?: BoardApi;
    chess?: Chess;
    onInitialize: (board: BoardApi, chess: Chess) => void;
    onMove: (board: BoardApi, chess: Chess) => (from: Key, to: Key) => void;
}

const BoardDisplay: React.FC<BoardDisplayProps> = ({
    board,
    chess,
    onInitialize,
    onMove,
}) => {
    const [orientation, setOrientation] = useState<Color>('white');

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
            setOrientation(board.state.orientation);
        }
    }, [board, setOrientation]);

    return (
        <Box
            gridArea='board'
            sx={{
                width: 1,
            }}
        >
            <Stack>
                <PlayerHeader type='header' orientation={orientation} pgn={chess?.pgn} />
                <Box
                    sx={{
                        aspectRatio: 1,
                        width: 1,
                    }}
                >
                    <Board onInitialize={onInitialize} onMove={onMove} />
                </Box>
                <PlayerHeader type='footer' orientation={orientation} pgn={chess?.pgn} />

                <Paper elevation={3} sx={{ mt: 1, boxShadow: 'none' }}>
                    <Stack direction='row' justifyContent='center'>
                        <Tooltip title='First Move'>
                            <IconButton aria-label='first move'>
                                <FirstPageIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Previous Move'>
                            <IconButton aria-label='previous move'>
                                <ChevronLeftIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Next Move'>
                            <IconButton aria-label='next move'>
                                <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Last Move'>
                            <IconButton aria-label='last move'>
                                <LastPageIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Flip Board'>
                            <IconButton
                                aria-label='flip board'
                                onClick={toggleOrientation}
                            >
                                <FlipIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
};

interface PgnBoardProps {
    pgn: string;
    showPlayerHeaders?: boolean;
}

const PgnBoard: React.FC<PgnBoardProps> = ({ pgn, showPlayerHeaders = true }) => {
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
            <BoardDisplay
                board={board}
                chess={chess}
                onInitialize={onInitialize}
                onMove={onMove}
            />

            {board && chess && (
                <>
                    <CurrentMoveContext.Provider value={{ currentMove: move }}>
                        <Stack gridArea='coach' height={1} sx={{ overflowY: 'auto' }}>
                            <PgnText pgn={chess.pgn} onClickMove={onClickMove} />
                        </Stack>
                    </CurrentMoveContext.Provider>
                </>
            )}
        </Box>
    );
};

export default PgnBoard;
