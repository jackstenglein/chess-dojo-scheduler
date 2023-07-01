import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import { Chessground } from 'chessground';
import { Api as BoardApi } from 'chessground/api';
import { Config } from 'chessground/config';
import { Key, Color } from 'chessground/types';
import { DrawShape } from 'chessground/draw';
import { Chess, Move, SQUARES } from '@jackstenglein/chess';

import './board.css';

export { Chess };
export type { BoardApi };

export function toColor(chess?: Chess): Color {
    if (!chess) {
        return 'white';
    }
    return chess.turn() === 'w' ? 'white' : 'black';
}

export function toDests(chess?: Chess): Map<Key, Key[]> {
    if (!chess) {
        return new Map();
    }
    const dests = new Map();
    SQUARES.forEach((s) => {
        const moves = chess.moves({ square: s, verbose: true });
        if (moves) {
            dests.set(
                s,
                moves.map((m) => (m as Move).to)
            );
        }
    });
    return dests;
}

const colors: Record<string, string> = { Y: 'yellow', R: 'red', B: 'blue', G: 'green' };

export function toShapes(chess?: Chess): DrawShape[] {
    if (!chess) {
        return [];
    }

    const currentMove = chess.currentMove();
    if (!currentMove) {
        return [];
    }

    const commentDiag = currentMove.commentDiag;
    let result: DrawShape[] = [];
    if (commentDiag) {
        if (commentDiag.colorArrows) {
            for (const comm of commentDiag.colorArrows) {
                result.push({
                    orig: comm.substring(1, 3) as Key,
                    dest: comm.substring(3, 5) as Key,
                    brush: colors[comm.substring(0, 1)],
                });
            }
        }
        if (commentDiag.colorFields) {
            for (const comm of commentDiag.colorFields) {
                result.push({
                    orig: comm.substring(1, 3) as Key,
                    brush: colors[comm.substring(0, 1)],
                });
            }
        }
    }
    return result;
}

export function reconcile(chess?: Chess, board?: BoardApi) {
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
        drawable: {
            shapes: toShapes(chess),
        },
    });
}

export function defaultOnMove(board: BoardApi, chess: Chess) {
    return (orig: string, dest: string) => {
        chess.move({ from: orig, to: dest });
        reconcile(chess, board);
    };
}

export interface BoardRef {
    chess: Chess;
    board: BoardApi | null;
}

interface BoardProps {
    config?: Config;
    onInitialize?: (board: BoardApi, chess: Chess) => void;
    onMove?: (board: BoardApi, chess: Chess) => (orig: Key, dest: Key) => void;
}

const Board: React.FC<BoardProps> = ({ config, onInitialize, onMove }) => {
    const chess = useState(new Chess())[0];
    const [board, setBoard] = useState<BoardApi | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (boardRef.current && !board) {
            const chessgroundApi = Chessground(boardRef.current, config);
            setBoard(chessgroundApi);
        } else if (boardRef.current && board) {
            if (onInitialize) {
                if (isInitialized) {
                    return;
                }
                setIsInitialized(true);
                onInitialize(board, chess);
                return;
            }

            if (config && config.fen) {
                chess.load(config.fen);
            }

            board.set({
                ...config,
                fen: chess.fen(),
                movable: {
                    color: toColor(chess),
                    free: false,
                    dests: toDests(chess),
                    events: {
                        after: onMove
                            ? onMove(board, chess)
                            : defaultOnMove(board, chess),
                    },
                },
            });
        }
    }, [
        boardRef,
        board,
        chess,
        config,
        isInitialized,
        setIsInitialized,
        onMove,
        onInitialize,
    ]);

    return (
        <Box width={1} height={1}>
            <div ref={boardRef} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

export default Board;
