import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Chess, Move } from '@jackstenglein/chess';
import { Box } from '@mui/material';

import { BoardApi, PrimitiveMove, reconcile } from '../Board';
import { Color } from 'chessground/types';
import { Game } from '../../database/game';
import { useAuth } from '../../auth/Auth';
import { ClockTextFieldId, CommentTextFieldId } from './boardTools/underboard/Editor';
import { GameCommentTextFieldId } from '../../games/view/GamePage';
import { TagTextFieldId } from './boardTools/underboard/Tags';
import { CONTAINER_ID } from './resize';
import ResizableContainer from './ResizableContainer';

interface ChessConfig {
    allowMoveDeletion?: boolean;
}

type ChessContextType = {
    chess?: Chess;
    board?: BoardApi;
    config?: ChessConfig;
    toggleOrientation?: () => void;
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
}) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const user = useAuth().user;
    const [, setOrientation] = useState(startOrientation);

    const keydownMap = useRef({ shift: false });

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
            setOrientation(board.state.orientation);
        }
    }, [board, setOrientation]);

    const chessContext = useMemo(
        () => ({
            chess,
            board,
            config: {
                allowMoveDeletion: user && game?.owner === user.username,
            },
            toggleOrientation,
        }),
        [chess, board, game, user, toggleOrientation]
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

    const gameOrientation = game?.orientation || startOrientation || 'white';
    useEffect(() => {
        if (gameOrientation !== board?.state.orientation) {
            toggleOrientation();
        }
    }, [gameOrientation, board, toggleOrientation]);

    const showUnderboard = showTags || showEditor || showExplorer;

    return (
        <Box
            id={CONTAINER_ID}
            sx={{
                gridArea: 'pgn',
                width: 1,
                maxWidth: 1,
                overflowX: 'clip',
            }}
        >
            <ChessContext.Provider value={chessContext}>
                <ResizableContainer
                    {...{
                        showUnderboard,
                        showExplorer,
                        showPlayerHeaders,
                        pgn,
                        fen,
                        startOrientation,
                        game,
                        showEditor,
                        onInitialize,
                        onMove,
                        onClickMove,
                        onSaveGame,
                    }}
                />
            </ChessContext.Provider>
        </Box>
    );
};

export default PgnBoard;
