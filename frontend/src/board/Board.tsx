import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

import { Chessground } from 'chessground';
import { Api as BoardApi } from 'chessground/api';
import { Config } from 'chessground/config';
import { Key, Color } from 'chessground/types';

import { Chess } from '@jackstenglein/chess';
import { Move } from 'chess.js';
import { SQUARES } from 'chess.js';

import './board.css';

export function toColor(chess: Chess): Color {
    return chess.turn() === 'w' ? 'white' : 'black';
}

export function toDests(chess: Chess): Map<Key, Key[]> {
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

export function defaultOnMove(board: BoardApi, chess: Chess) {
    return (orig: string, dest: string) => {
        const move = chess.move({ from: orig, to: dest });
        if (move) {
            board.set({
                fen: move.after,
                turnColor: toColor(chess),
                movable: {
                    color: toColor(chess),
                    dests: toDests(chess),
                },
            });
        }
    };
}

interface BoardProps {
    config: Config;
    onMove?: (board: BoardApi, chess: Chess) => (orig: Key, dest: Key) => void;
}

const Board: React.FC<BoardProps> = ({ config, onMove }) => {
    const chess = useState(new Chess())[0];
    const [board, setBoard] = useState<BoardApi | null>(null);
    const boardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (boardRef.current && !board) {
            const chessgroundApi = Chessground(boardRef.current, config);
            setBoard(chessgroundApi);
        } else if (boardRef.current && board) {
            chess.load(config.fen!);

            board.set({
                ...config,
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
    }, [boardRef, board, chess, config, onMove]);

    return (
        <Box width={1} height={1}>
            <div ref={boardRef} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

export default Board;
