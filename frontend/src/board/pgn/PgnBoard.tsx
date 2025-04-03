import {
    correctMoveGlyphHtml,
    incorrectMoveGlyphHtml,
} from '@/components/material/memorizegames/moveGlyphs';
import useGame from '@/context/useGame';
import LoadingPage from '@/loading/LoadingPage';
import { Chess, Observer, Square } from '@jackstenglein/chess';
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
import { useLocalStorage } from 'usehooks-ts';
import { BoardApi, defaultOnMove, onMoveFunc, PrimitiveMove, reconcile } from '../Board';
import ResizableContainer from './ResizableContainer';
import { ShowGlyphsKey } from './boardTools/underboard/settings/ViewerSettings';
import { UnderboardTab } from './boardTools/underboard/underboardTabs';
import { ButtonProps as MoveButtonProps } from './pgnText/MoveButton';
import { CONTAINER_ID } from './resize';

export const BlockBoardKeyboardShortcuts = 'blockBoardKeyboardShortcuts';

export enum PgnBoardMode {
    Normal = 'NORMAL',
    Solitaire = 'SOLITAIRE',
}

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
    mode?: PgnBoardMode;
    chess?: Chess;
    board?: BoardApi;
    config?: ChessConfig;
    toggleOrientation?: () => void;
    keydownMap?: React.MutableRefObject<Record<string, boolean>>;
    slots?: PgnBoardSlots;
    slotProps?: PgnBoardSlotProps;
    orientation?: 'white' | 'black';
    solitaire?: {
        solution: React.RefObject<Chess>;
        isComplete: boolean;
        reset: () => void;
    };
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
    afterPgnText?: JSX.Element;
}

export interface PgnBoardSlotProps {
    pgnText?: {
        hideResult?: boolean;
    };
    board?: {
        onMove?: onMoveFunc;
    };
}

interface WrongMove {
    from: Square;
    to: Square;
    promotion?: string | undefined;
}

interface PgnBoardProps extends ChessConfig {
    underboardTabs: UnderboardTab[];
    initialUnderboardTab?: string;
    mode?: PgnBoardMode;
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    onInitialize?: (board: BoardApi, chess: Chess) => void;
    slots?: PgnBoardSlots;
    slotProps?: PgnBoardSlotProps;
}

const PgnBoard = forwardRef<PgnBoardApi, PgnBoardProps>(
    (
        {
            underboardTabs,
            initialUnderboardTab,
            mode,
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
            slotProps,
        },
        ref,
    ) => {
        const { game } = useGame();
        const [board, setBoard] = useState<BoardApi>();

        const disableNullMoves = disableNullMovesProp ?? !game;
        const [chess] = useState<Chess>(new Chess({ disableNullMoves }));
        const [orientation, setOrientation] = useState(game?.orientation || startOrientation);
        const keydownMap = useRef<Record<string, boolean>>({});
        const [showGlyphs] = useLocalStorage(ShowGlyphsKey, false);

        // Solitaire chess
        const solitaireSolution = useRef<Chess>(new Chess({ pgn }));
        const solitaireIncorrectMoves = useRef<WrongMove[]>([]);
        const [solitaireComplete, setSolitaireComplete] = useState(false);
        const onSolitaireMove = useCallback(
            (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
                if (
                    (chess.history().length && chess.currentMove() !== chess.history().at(-1)) ||
                    solitaireSolution.current?.currentMove() ===
                        solitaireSolution.current?.history().at(-1)
                ) {
                    defaultOnMove(showGlyphs)(board, chess, primMove);
                    return;
                }

                const move = {
                    from: primMove.orig,
                    to: primMove.dest,
                    promotion: primMove.promotion,
                };
                if (solitaireSolution.current?.isMainline(move)) {
                    solitaireSolution.current.move(move);
                    const currentMove = chess.currentMove();
                    const newMove = chess.move(move);
                    for (const m of solitaireIncorrectMoves.current) {
                        chess.move(m, { previousMove: currentMove });
                    }
                    solitaireIncorrectMoves.current = [];

                    chess.seek(newMove);
                    reconcile(chess, board, showGlyphs);
                    board.set({
                        drawable: {
                            autoShapes: [
                                { orig: move.to, customSvg: { html: correctMoveGlyphHtml } },
                            ],
                        },
                    });
                    setSolitaireComplete(
                        solitaireSolution.current.currentMove() ===
                            solitaireSolution.current.history().at(-1),
                    );
                } else {
                    solitaireIncorrectMoves.current.push(move);
                    board.set({
                        movable: {},
                        premovable: {
                            enabled: false,
                        },
                        drawable: {
                            autoShapes: [
                                { orig: move.to, customSvg: { html: incorrectMoveGlyphHtml } },
                            ],
                            eraseOnClick: false,
                        },
                    });
                    setTimeout(() => {
                        reconcile(chess, board, showGlyphs);
                    }, 500);
                }
            },
            [showGlyphs],
        );

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
                slotProps: {
                    ...slotProps,
                    board: {
                        onMove: slotProps?.board?.onMove
                            ? slotProps.board.onMove
                            : mode === PgnBoardMode.Solitaire
                              ? onSolitaireMove
                              : undefined,
                    },
                },
                orientation,
                mode,
                solitaire: {
                    solution: solitaireSolution,
                    isComplete: solitaireComplete,
                    reset: () => {
                        solitaireSolution.current?.seek(null);
                        solitaireIncorrectMoves.current = [];
                        setSolitaireComplete(false);
                    },
                },
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
                slotProps,
                disableTakebacks,
                disableEngine,
                initKey,
                showElapsedMoveTimes,
                mode,
                solitaireSolution,
                solitaireComplete,
                onSolitaireMove,
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

        useEffect(() => {
            if (mode === PgnBoardMode.Solitaire) {
                solitaireSolution.current = new Chess({ pgn });
                solitaireSolution.current.seek(null);
                solitaireIncorrectMoves.current = [];
            }
        }, [mode, pgn]);

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

        let finalPgn = pgn;
        if (mode === PgnBoardMode.Solitaire) {
            finalPgn = pgn?.split('\n\n')[0];
        }

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
                {(!chess || (!finalPgn && !fen)) && (
                    <LoadingPage disableShrink sx={{ position: 'absolute', width: 1 }} />
                )}

                {(finalPgn || fen) && (
                    <ChessContext.Provider value={chessContext}>
                        <ResizableContainer
                            {...{
                                underboardTabs,
                                initialUnderboardTab,
                                showPlayerHeaders,
                                pgn: finalPgn,
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
