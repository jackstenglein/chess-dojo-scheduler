import { Annotations } from '@bendk/chess-tree';
import React, { useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Chess } from '@jackstenglein/chess';
import { DrawShape } from 'chessground/draw';
import Board, { BoardApi, PrimitiveMove, defaultOnDrawableChange, reconcile } from '../board/Board';
import { useChess } from '../board/pgn/PgnBoard';

export interface BookBoardProps {
    initialPosition?: string;
    size: number|string;
    annotations?: Annotations;
    onInitialize?: (board: BoardApi, chess: Chess) => void;
    onMovesChange?: (moves: string[]) => void;
    onAnnotationsChange?: (annotations: Annotations) => void;
}

interface BookBoardCallbacks {
    onMovesChange?: (moves: string[]) => void;
    onAnnotationsChange?: (annotations: Annotations) => void;
    defaultOnDrawableChange?: (shapes: DrawShape[]) => void;
}

const colorToAnimationColor: Record<string, string> = {
    yellow: 'Y',
    red: 'R',
    blue: 'B',
    green: 'G',
    orange: 'O',
    magenta: 'M',
};

/**
 * Opening book board
 *
 * This presents a simplified board that tracks exactly one line.
 */
const BookBoard: React.FC<BookBoardProps> = ({initialPosition, size, annotations, onInitialize, onMovesChange, onAnnotationsChange}) => {
    const {chess, board} = useChess()
    const callbacks = useRef<BookBoardCallbacks>({})
    // The callbacks we pass to `Board` only get registered once at startup.  To workaround that, we
    // store our callbacks in a ref and reference that ref from the callbacks passed to `Board`
    callbacks.current.onMovesChange = onMovesChange
    callbacks.current.onAnnotationsChange = onAnnotationsChange

    const onInitializeBoard = (board: BoardApi, chess: Chess) => {
        callbacks.current.defaultOnDrawableChange = defaultOnDrawableChange(chess)
        if(onInitialize) {
            onInitialize(board, chess)
        }
    }

    const onMove = useCallback(
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            // Delete the next move, if there is one, to ensure that we only track 1 variation
            const nextMove = chess.nextMove()
            if (nextMove !== null) {
                chess.delete(nextMove)
            }
            chess.move({
                from: primMove.orig,
                to: primMove.dest,
                promotion: primMove.promotion,
            });

            if(board) {
                reconcile(chess, board);
            }
            if (callbacks.current?.onMovesChange) {
                const moves = chess.history()
                    .slice(0, chess.currentMove()?.ply ?? 0)
                    .map(m => m.san);
                callbacks.current.onMovesChange(moves)
            }
        },
        []
    );

    const onDrawableChange = useCallback((shapes: DrawShape[]) => {
        const arrows = []
        const squares = []
        for(const shape of shapes) {
            const color = colorToAnimationColor[shape.brush ?? ""]
            if (color === undefined) {
                continue
            }
            if (shape.dest === undefined) {
                squares.push(`${color}${shape.orig}`)
            } else {
                arrows.push(`${color}${shape.orig}${shape.dest}`)
            }
        }
        if(callbacks.current?.onAnnotationsChange) {
            callbacks.current.onAnnotationsChange({squares, arrows})
        }
        if(callbacks.current?.defaultOnDrawableChange) {
            callbacks.current.defaultOnDrawableChange(shapes)
        }
    }, [])

    useEffect(() => {
        if(chess) {
            if(annotations) {
                chess.setDrawables(annotations.arrows, annotations.squares)
            } else {
                chess.setDrawables([], [])
            }
            if(board) {
                reconcile(chess, board)
            }
        }
    }, [chess, board, annotations])

    return <Box width={size} height={size}>
        <Board
            onInitialize={onInitializeBoard}
            onMove={onMove}
            config={{
                fen: initialPosition,
                orientation: "white",
                drawable: {
                    onChange: onDrawableChange,
                    eraseOnClick: false,
                }
            }}
        />
    </Box>
};

export default BookBoard
