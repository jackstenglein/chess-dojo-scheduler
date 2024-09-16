import { Chess, Square } from 'chess.js';
import { LineEval } from './engineEval';

/**
 * Gets the evaluation label (Ex: +2.3, -1, M5) for the given line.
 * @param line The line to get the evaluation label for.
 * @returns The evaluation label.
 */
export const getLineEvalLabel = (line: Pick<LineEval, 'cp' | 'mate'>): string => {
    if (line.cp !== undefined) {
        return `${line.cp > 0 ? '+' : ''}${(line.cp / 100).toFixed(2)}`;
    }

    if (line.mate) {
        return `${line.mate > 0 ? '+' : '-'}M${Math.abs(line.mate)}`;
    }

    return '?';
};

/**
 * Returns a function that converts a move's UCI to SAN. The function
 * must be called in order on each move.
 * @param fen The starting position FEN.
 * @returns A function that converts a move's UCI to SAN.
 */
export const moveLineUciToSan = (fen: string): ((moveUci: string) => string) => {
    const game = new Chess(fen);

    return (moveUci: string): string => {
        try {
            const move = game.move(uciMoveParams(moveUci));
            return move.san;
        } catch (e) {
            return moveUci;
        }
    };
};

/**
 * Converts a UCI move string into a Chess.js move object.
 * @param uciMove The UCI move to convert.
 * @returns The Chess.js move object.
 */
export const uciMoveParams = (
    uciMove: string,
): {
    from: Square;
    to: Square;
    promotion?: string | undefined;
} => ({
    from: uciMove.slice(0, 2) as Square,
    to: uciMove.slice(2, 4) as Square,
    promotion: uciMove.slice(4, 5) || undefined,
});
