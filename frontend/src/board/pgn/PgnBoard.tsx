import { Chess, Move } from '@jackstenglein/chess';
import { Box } from '@mui/material';
import { Color } from 'chessground/types';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useAuth } from '../../auth/Auth';
import { useGame } from '../../games/view/GamePage';
import LoadingPage from '../../loading/LoadingPage';
import { BoardApi, PrimitiveMove, reconcile } from '../Board';
import KeyboardHandler from './KeyboardHandler';
import ResizableContainer from './ResizableContainer';
import { CONTAINER_ID } from './resize';

export const BlockBoardKeyboardShortcuts = 'blockBoardKeyboardShortcuts';

interface ChessConfig {
    allowMoveDeletion?: boolean;
}

type ChessContextType = {
    chess?: Chess;
    board?: BoardApi;
    config?: ChessConfig;
    toggleOrientation?: () => void;
    keydownMap?: React.MutableRefObject<Record<string, boolean>>;
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
    startOrientation?: Color;
}

const PgnBoard: React.FC<PgnBoardProps> = ({
    pgn,
    fen,
    showTags,
    showEditor,
    showExplorer,
    showPlayerHeaders = true,
    startOrientation = 'white',
}) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const user = useAuth().user;
    const [, setOrientation] = useState(startOrientation);
    const keydownMap = useRef<Record<string, boolean>>({});
    const { game } = useGame();

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
            keydownMap,
        }),
        [chess, board, game, user, toggleOrientation, keydownMap],
    );

    const onMove = useCallback(
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            chess.move({
                from: primMove.orig,
                to: primMove.dest,
                promotion: primMove.promotion,
            });
            reconcile(chess, board);
        },
        [],
    );

    const onInitialize = useCallback(
        (board: BoardApi, chess: Chess) => {
            console.log('Initialized');
            setBoard(board);
            setChess(chess);
        },
        [setBoard, setChess],
    );

    const onClickMove = useCallback(
        (move: Move | null) => {
            chess?.seek(move);
            reconcile(chess, board);
        },
        [chess, board],
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
                overflowY: chess ? undefined : 'hidden',
            }}
        >
            {(!chess || (!pgn && !fen)) && (
                <LoadingPage disableShrink sx={{ position: 'absolute', width: 1 }} />
            )}

            {(pgn || fen) && (
                <ChessContext.Provider value={chessContext}>
                    <KeyboardHandler />

                    <ResizableContainer
                        {...{
                            showUnderboard,
                            showExplorer,
                            showPlayerHeaders,
                            pgn,
                            fen,
                            startOrientation,
                            showEditor,
                            onInitialize,
                            onMove,
                            onClickMove,
                        }}
                    />
                </ChessContext.Provider>
            )}
        </Box>
    );
};

export default PgnBoard;
