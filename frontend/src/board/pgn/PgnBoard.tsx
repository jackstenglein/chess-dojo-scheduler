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

import Board, { BoardApi, PrimitiveMove, reconcile } from '../Board';
import PgnText from './pgnText/PgnText';
import { Color } from 'chessground/types';
import BoardTools from './BoardTools';
import { Game } from '../../database/game';
import { useAuth } from '../../auth/Auth';
import { ClockTextFieldId, CommentTextFieldId } from './Editor';

type ChessContextType = {
    chess?: Chess;
    board?: BoardApi;
};

export const ChessContext = createContext<ChessContextType>(null!);

export function useChess() {
    return useContext(ChessContext);
}

interface PgnBoardProps {
    pgn: string;
    showPlayerHeaders?: boolean;
    showTags?: boolean;
    showEditor?: boolean;
    game?: Game;
    startOrientation?: Color;
    sx?: SxProps<Theme>;
}

const PgnBoard: React.FC<PgnBoardProps> = ({
    pgn,
    showTags,
    showEditor,
    game,
    showPlayerHeaders = true,
    startOrientation = 'white',
    sx,
}) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const user = useAuth().user!;

    const keydownMap = useRef({ shift: false });

    const chessContext = useMemo(
        () => ({
            chess,
            board,
        }),
        [chess, board]
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!chess || !board) {
                return;
            }

            if (
                document.activeElement?.id === ClockTextFieldId ||
                document.activeElement?.id === CommentTextFieldId
            ) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
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

    const showUnderboard = showTags || showEditor;

    return (
        <Box
            sx={
                sx || {
                    gridArea: 'pgn',
                    display: 'grid',
                    width: 1,
                    gridTemplateRows: {
                        xs: `auto auto auto auto auto minmax(auto, 400px)`,
                        md: 'var(--player-header-height) var(--board-size) var(--player-header-height) auto auto',
                        xl: 'var(--player-header-height) var(--board-size) var(--player-header-height) auto',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        xl: `auto ${
                            showUnderboard ? 'var(--coach-width) var(--gap)' : ''
                        }  var(--board-size) var(--gap) var(--coach-width) auto`,
                    },
                    gridTemplateAreas: {
                        xs: `"playerheader"
                             "board"
                             "playerfooter"
                             "boardButtons"
                             "underboard" 
                             "coach"`,

                        md: `". playerheader . coach ." 
                             ". board . coach ." 
                             ". playerfooter . coach ."
                             ". boardButtons . . ." 
                             ". underboard . . ."`,

                        xl: `". ${
                            showUnderboard ? 'underboard .' : ''
                        } playerheader . coach ." 
                             ". ${showUnderboard ? 'underboard .' : ''} board . coach ." 
                             ". ${
                                 showUnderboard ? 'underboard .' : ''
                             } playerfooter . coach ."
                             ". ${showUnderboard ? '. .' : ''} boardButtons . . ."`,
                    },
                }
            }
        >
            <ChessContext.Provider value={chessContext}>
                <Box
                    gridArea='board'
                    sx={{
                        width: 1,
                        aspectRatio: 1,
                    }}
                >
                    <Board
                        config={{
                            pgn,
                            orientation: startOrientation,
                        }}
                        onInitialize={onInitialize}
                        onMove={onMove}
                    />
                </Box>

                {board && chess && (
                    <BoardTools
                        pgn={pgn}
                        showPlayerHeaders={showPlayerHeaders}
                        onClickMove={onClickMove}
                        showTags={showTags}
                        showEditor={showEditor && game?.owner === user.username}
                        showSave={game?.owner === user.username}
                        showDelete={game?.owner === user.username}
                        game={game}
                    />
                )}

                {board && chess && (
                    <>
                        <Stack
                            gridArea='coach'
                            height={1}
                            sx={{ overflowY: 'auto', mt: { xs: 2, md: 0 } }}
                        >
                            <PgnText pgn={chess.pgn} onClickMove={onClickMove} />
                        </Stack>
                    </>
                )}
            </ChessContext.Provider>
        </Box>
    );
};

export default PgnBoard;
