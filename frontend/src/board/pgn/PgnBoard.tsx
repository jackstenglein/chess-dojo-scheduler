import { Chess, Move } from '@jackstenglein/chess';
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
import { useGame } from '../../games/view/GamePage';
import LoadingPage from '../../loading/LoadingPage';
import { BoardApi, PrimitiveMove, reconcile, changeOTBMode } from '../Board';
import { UnderboardTab } from './boardTools/underboard/Underboard';
import { ButtonProps as MoveButtonProps } from './pgnText/MoveButton';
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
    slots?: PgnBoardSlots;
};

export const ChessContext = createContext<ChessContextType>({});

export function useChess() {
    return useContext(ChessContext);
}

export function changeOTBModeButtonTrigger(mode?: boolean){
    changeOTBMode(mode);
}

export interface PgnBoardApi {
    getPgn: () => string;
}

export interface PgnBoardSlots {
    moveButtonExtras?: React.JSXElementConstructor<MoveButtonProps>;
}

interface PgnBoardProps {
    underboardTabs: UnderboardTab[];
    initialUnderboardTab?: string;
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    onInitialize?: (board: BoardApi, chess: Chess) => void;
    allowMoveDeletion?: boolean;
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
            allowMoveDeletion,
            slots,
        },
        ref,
    ) => {
        const [board, setBoard] = useState<BoardApi>();
        const [chess] = useState<Chess>(new Chess());
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
                    allowMoveDeletion,
                },
                toggleOrientation,
                keydownMap,
                slots,
            }),
            [chess, board, allowMoveDeletion, toggleOrientation, keydownMap, slots],
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
                parentOnInitialize?.(board, chess);
                setBoard(board);
            },
            [parentOnInitialize, setBoard],
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

        useImperativeHandle(
            ref,
            () => {
                return {
                    getPgn() {
                        return chess.renderPgn() || '';
                    },
                };
            },
            [chess],
        );

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
                                onMove,
                                onClickMove,
                            }}
                        />
                    </ChessContext.Provider>
                )}
            </Box>
        );
    },
);

export default PgnBoard;
