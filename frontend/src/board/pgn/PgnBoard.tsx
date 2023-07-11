import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Chess, Move } from '@jackstenglein/chess';
import { Box, Stack, SxProps, Theme } from '@mui/material';

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
import Tags from './Tags';
import { Game } from '../../database/game';

type ChessContextType = {
    chess?: Chess;
};

export const ChessContext = createContext<ChessContextType>(null!);

export function useChess() {
    return useContext(ChessContext);
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
    tagsVisible?: boolean;
    toggleTags?: () => void;
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
    tagsVisible,
    toggleTags,
}) => {
    const [orientation, setOrientation] = useState<Color>(startOrientation);

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
            setOrientation(board.state.orientation);
        }
    }, [board, setOrientation]);

    useEffect(() => {
        const onArrowKeys = (event: KeyboardEvent) => {
            if (event.key === 'f') {
                toggleOrientation();
            }
        };
        window.addEventListener('keyup', onArrowKeys);
        return () => {
            window.removeEventListener('keyup', onArrowKeys);
        };
    }, [toggleOrientation]);

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
            const nextMove = chess.nextMove();
            if (nextMove) {
                onClickMove(nextMove);
            }
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
                    pgn={config?.pgn || ''}
                    onFirstMove={onFirstMove}
                    onPreviousMove={onPreviousMove}
                    onNextMove={onNextMove}
                    onLastMove={onLastMove}
                    toggleOrientation={toggleOrientation}
                    tagsVisible={tagsVisible}
                    toggleTags={toggleTags}
                />
            </Stack>
        </Box>
    );
};

interface PgnBoardProps {
    pgn: string;
    showPlayerHeaders?: boolean;
    showTags?: boolean;
    game?: Game;
    startOrientation?: Color;
    sx?: SxProps<Theme>;
}

const PgnBoard: React.FC<PgnBoardProps> = ({
    pgn,
    showTags,
    game,
    showPlayerHeaders = true,
    startOrientation = 'white',
    sx,
}) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const [tagsVisible, setTagsVisible] = useState(false);
    const keydownMap = useRef({ shift: false });

    const chessContext = useMemo(
        () => ({
            chess,
        }),
        [chess]
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!chess || !board) {
                return;
            }

            if (event.key === 'Shift') {
                keydownMap.current.shift = true;
            } else if (event.key === 'ArrowRight') {
                let nextMove = chess.nextMove();
                if (keydownMap.current.shift && nextMove?.variations.length) {
                    nextMove = nextMove.variations[0][0];
                }

                if (nextMove) {
                    chess.seek(nextMove);
                    reconcile(chess, board);
                }
            } else if (event.key === 'ArrowLeft') {
                chess.seek(chess.previousMove());
                reconcile(chess, board);
            }
        },
        [board, chess]
    );

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Shift') {
            keydownMap.current.shift = false;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [onKeyDown, onKeyUp]);

    const onMove = useCallback(
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            chess.move({
                from: primMove.orig,
                to: primMove.dest,
                promotion: primMove.promotion,
            });
            reconcile(chess, board);
        },
        []
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
        },
        [chess, board]
    );

    return (
        <Box
            sx={
                sx || {
                    gridArea: 'pgn',
                    display: 'grid',
                    width: 1,
                    rowGap: 'var(--gap)',
                    gridTemplateRows: {
                        xs: `auto ${tagsVisible ? 'auto' : ''} minmax(auto, 400px)`,
                        md: 'calc(var(--board-size) + var(--tools-height) + 8px + 2 * var(--player-header-height)) auto',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: `"board" ${tagsVisible ? '"tags"' : ''} "coach"`,
                        md: '". board . coach ." ". tags . . ."',
                    },
                }
            }
        >
            <ChessContext.Provider value={chessContext}>
                <BoardDisplay
                    config={{
                        pgn,
                        orientation: startOrientation,
                    }}
                    board={board}
                    chess={chess}
                    showPlayerHeaders={showPlayerHeaders}
                    startOrientation={startOrientation}
                    tagsVisible={tagsVisible}
                    toggleTags={showTags ? () => setTagsVisible(!tagsVisible) : undefined}
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

                {tagsVisible && (
                    <Box gridArea='tags'>
                        <Tags tags={chess?.pgn.header.tags} game={game} />
                    </Box>
                )}
            </ChessContext.Provider>
        </Box>
    );
};

export default PgnBoard;
