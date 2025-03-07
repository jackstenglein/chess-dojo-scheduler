import useGame from '@/context/useGame';
import LoadingPage from '@/loading/LoadingPage';
import { Chess, Observer } from '@jackstenglein/chess';
import { Box } from '@mui/material';
import { Color } from 'chessground/types';
import React, {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { BoardApi } from '../Board';
import ResizableContainer from './ResizableContainer';
import { UnderboardTab } from './boardTools/underboard/underboardTabs';
import { ButtonProps as MoveButtonProps } from './pgnText/MoveButton';
import { CONTAINER_ID } from './resize';

export const BlockBoardKeyboardShortcuts = 'blockBoardKeyboardShortcuts';

interface ChessConfig {
    initKey?: string;
    allowMoveDeletion?: boolean;
    allowDeleteBefore?: boolean;
    disableTakebacks?: Color | 'both';
    disableNullMoves?: boolean;
    disableEngine?: boolean;
    showElapsedMoveTimes?: boolean;
}

interface ChessContextType {
    chess?: Chess;
    board?: BoardApi;
    config?: ChessConfig;
    toggleOrientation?: () => void;
    keydownMap?: React.MutableRefObject<Record<string, boolean>>;
    slots?: PgnBoardSlots;
    orientation?: 'white' | 'black';
}

export const ChessContext = createContext<ChessContextType>({});

export function useChess() {
    return useContext(ChessContext);
}

export interface PgnBoardApi {
    getPgn: () => string;
    addObserver: (observer: Observer) => void;
    removeObserver: (observer: Observer) => void;
}

export interface PgnBoardSlots {
    moveButtonExtras?: React.JSXElementConstructor<MoveButtonProps>;
}

interface PgnBoardProps extends ChessConfig {
    underboardTabs: UnderboardTab[];
    initialUnderboardTab?: string;
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    onInitialize?: (board: BoardApi, chess: Chess) => void;
    slots?: PgnBoardSlots;
}

const PgnBoard = forwardRef<PgnBoardApi, PgnBoardProps>(
    (
        {
            underboardTabs,
            initialUnderboardTab,
            pgn,
            fen,
            showPlayerHeaders = true,
            startOrientation = 'white',
            onInitialize: parentOnInitialize,
            initKey,
            allowMoveDeletion,
            allowDeleteBefore,
            disableTakebacks,
            disableNullMoves: disableNullMovesProp,
            disableEngine,
            showElapsedMoveTimes,
            slots,
        },
        ref,
    ) => {
        const { game } = useGame();
        const [board, setBoard] = useState<BoardApi>();

        const disableNullMoves = disableNullMovesProp ?? !game;
        const [chess] = useState<Chess>(new Chess({ disableNullMoves }));
        const [orientation, setOrientation] = useState(game?.orientation || startOrientation);
        const keydownMap = useRef<Record<string, boolean>>({});

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
                    initKey,
                    allowMoveDeletion,
                    allowDeleteBefore,
                    disableTakebacks,
                    disableEngine,
                    showElapsedMoveTimes,
                },
                toggleOrientation,
                keydownMap,
                slots,
                orientation,
            }),
            [
                chess,
                board,
                allowMoveDeletion,
                allowDeleteBefore,
                orientation,
                toggleOrientation,
                keydownMap,
                slots,
                disableTakebacks,
                disableEngine,
                initKey,
                showElapsedMoveTimes,
            ],
        );

        const onInitialize = useCallback(
            (board: BoardApi, chess: Chess) => {
                parentOnInitialize?.(board, chess);
                setBoard(board);
            },
            [parentOnInitialize, setBoard],
        );

        const gameOrientation = game?.orientation || startOrientation || 'white';
        useEffect(() => {
            if (gameOrientation !== board?.state.orientation) {
                setOrientation(gameOrientation);
                toggleOrientation();
            }
        }, [gameOrientation, board, toggleOrientation]);

        useEffect(() => {
            chess.disableNullMoves = disableNullMoves;
        }, [chess, disableNullMoves]);

        useImperativeHandle(ref, () => {
            return {
                getPgn() {
                    return chess.renderPgn() || '';
                },
                addObserver(observer: Observer) {
                    chess.addObserver(observer);
                },
                removeObserver(observer: Observer) {
                    chess.removeObserver(observer);
                },
            };
        }, [chess]);

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
                        <ResizableContainer
                            {...{
                                underboardTabs,
                                initialUnderboardTab,
                                showPlayerHeaders,
                                pgn,
                                fen,
                                startOrientation,
                                onInitialize,
                            }}
                        />
                    </ChessContext.Provider>
                )}
            </Box>
        );
    },
);
PgnBoard.displayName = 'PgnBoard';

export default PgnBoard;
