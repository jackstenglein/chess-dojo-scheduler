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
import BoardButtons from './boardTools/boardButtons/BoardButtons';
import { Game } from '../../database/game';
import { useAuth } from '../../auth/Auth';
import { ClockTextFieldId, CommentTextFieldId } from './boardTools/underboard/Editor';
import { GameCommentTextFieldId } from '../../games/view/GamePage';
import { TagTextFieldId } from './boardTools/underboard/Tags';
import PlayerHeader from './PlayerHeader';
import Underboard from './boardTools/underboard/Underboard';

interface ChessConfig {
    allowMoveDeletion?: boolean;
}

type ChessContextType = {
    chess?: Chess;
    board?: BoardApi;
    config?: ChessConfig;
};

export const ChessContext = createContext<ChessContextType>(null!);

export function useChess() {
    return useContext(ChessContext);
}

interface PgnBoardProps {
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    showTags?: boolean;
    showEditor?: boolean;
    showExplorer?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;
    startOrientation?: Color;
    sx?: SxProps<Theme>;
}

const PgnBoard: React.FC<PgnBoardProps> = ({
    pgn,
    fen,
    showTags,
    showEditor,
    showExplorer,
    game,
    onSaveGame,
    showPlayerHeaders = true,
    startOrientation = 'white',
    sx,
}) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const user = useAuth().user;

    const keydownMap = useRef({ shift: false });

    const chessContext = useMemo(
        () => ({
            chess,
            board,
            config: {
                allowMoveDeletion: user && game?.owner === user.username,
            },
        }),
        [chess, board, game, user]
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!chess || !board) {
                return;
            }

            if (
                document.activeElement?.id === ClockTextFieldId ||
                document.activeElement?.id === CommentTextFieldId ||
                document.activeElement?.id === GameCommentTextFieldId ||
                document.activeElement?.id === TagTextFieldId
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

    const orientation = game?.orientation || 'white';
    useEffect(() => {
        if (board && board.state.orientation !== orientation) {
            board.toggleOrientation();
        }
    }, [board, orientation]);

    const showUnderboard = showTags || showEditor || showExplorer;

    return (
        <Box
            sx={
                sx || {
                    gridArea: 'pgn',
                    display: 'grid',
                    width: 1,
                    gridTemplateRows: {
                        xs: `${
                            showPlayerHeaders ? 'auto auto' : ''
                        } auto auto minmax(auto, calc(100vh - (100vw - 32px) - 30px ${
                            showPlayerHeaders ? '- 56px' : ''
                        } - 40px)) auto`,

                        md: `${
                            showPlayerHeaders ? 'var(--player-header-height)' : ''
                        } var(--board-size) ${
                            showPlayerHeaders ? 'var(--player-header-height)' : ''
                        } auto auto`,

                        xl: `${
                            showPlayerHeaders ? 'var(--player-header-height)' : ''
                        } var(--board-size) ${
                            showPlayerHeaders ? 'var(--player-header-height)' : ''
                        } 48px`,
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        xl: `auto ${
                            showUnderboard ? 'var(--underboard-width) var(--gap)' : ''
                        }  var(--board-size) var(--gap) var(--coach-width) auto`,
                    },
                    gridTemplateAreas: {
                        xs: `${showPlayerHeaders ? '"playerheader"' : ''}
                             "board"
                             ${showPlayerHeaders ? '"playerfooter"' : ''}
                             "boardButtons"
                             "coach"
                             "underboard"`,

                        md: `${showPlayerHeaders ? '". playerheader . coach ."' : ''}
                             ". board . coach ." 
                             ${showPlayerHeaders ? '". playerfooter . coach ."' : ''}
                             ". boardButtons . . ." 
                             ". underboard . . ."`,

                        xl: `${
                            showPlayerHeaders
                                ? `". ${
                                      showUnderboard ? 'underboard .' : ''
                                  } playerheader . coach ."`
                                : ''
                        }
                             ". ${showUnderboard ? 'underboard .' : ''} board . coach ." 
                             ${
                                 showPlayerHeaders
                                     ? `". ${
                                           showUnderboard ? 'underboard .' : ''
                                       } playerfooter . coach ."`
                                     : ''
                             }
                             ". ${
                                 showUnderboard ? 'underboard .' : ''
                             } boardButtons . coach ."`,
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
                            fen,
                            orientation: startOrientation,
                        }}
                        onInitialize={onInitialize}
                        onMove={onMove}
                    />
                </Box>

                {chess && showPlayerHeaders && (
                    <>
                        <PlayerHeader type='header' pgn={chess?.pgn} />
                        <PlayerHeader type='footer' pgn={chess?.pgn} />
                    </>
                )}

                {board && chess && (
                    <>
                        <BoardButtons
                            onClickMove={onClickMove}
                            game={game}
                            showSave={showEditor && game?.owner === user?.username}
                        />

                        <Underboard
                            showExplorer={showExplorer}
                            game={game}
                            onSaveGame={onSaveGame}
                        />

                        <Stack
                            gridArea='coach'
                            height={1}
                            sx={{
                                overflowY: 'auto',
                                mb: { xs: 1, md: 0 },
                            }}
                        >
                            <PgnText onClickMove={onClickMove} />
                        </Stack>
                    </>
                )}
            </ChessContext.Provider>
        </Box>
    );
};

export default PgnBoard;
