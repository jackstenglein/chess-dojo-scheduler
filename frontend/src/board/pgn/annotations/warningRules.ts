import { Chess, Move } from '@jackstenglein/chess';
import { badMoveNags, evalNags, getNagInSet, goodMoveNags } from '../Nag';

export interface WarningRule {
    displayName: string;
    description: string;
    predicate: (chess: Chess, move: Move | null) => boolean;
}

export interface Warning {
    displayName: string;
    description: string;
    moves: Array<Move | null>;
}

const ChesscomCommentAfterRegex =
    /(BLUNDER|INACCURACY|MISSED MATE) \((((\+|-)\d+\.?\d*)|(♔ Mate in \d))\)/;
const ChesscomCommentMoveRegex =
    /(\((\+|-)\d+\.?\d*\) The best move was)|(\(♔ Mate in \d\) Checkmate after)/;

const LichessCommentAfterRegex = /(Mistake|Inaccuracy|Blunder)\. .* was best\./;

const rules: WarningRule[] = [
    {
        displayName: 'Poor Move Missing Improvement',
        description:
            "You marked a move as dubious, a mistake or a blunder, but didn't include a comment, variation or evaluation. Consider adding a comment, variation or eval symbol to describe why the move is bad and what should have been played instead.",
        predicate: (chess, move) => {
            return (
                !!move &&
                !!getNagInSet(badMoveNags, move.nags) &&
                !move.commentMove &&
                !move.commentAfter &&
                move.variations.length === 0 &&
                (chess.isInMainline(move) ||
                    (!move.next && !getNagInSet(evalNags, move.nags)))
            );
        },
    },
    {
        displayName: 'Good Move Missing Explanation',
        description:
            "You marked a move as interesting, good or brilliant, but didn't include a comment, variation or evaluation explaining why. Consider adding a comment, variation or eval symbol to make your annotations clearer.",
        predicate: (chess, move) => {
            return (
                !!move &&
                !!getNagInSet(goodMoveNags, move.nags) &&
                !move.commentMove &&
                !move.commentAfter &&
                move.variations.length === 0 &&
                (chess.isInMainline(move) ||
                    (!move.next && !getNagInSet(evalNags, move.nags)))
            );
        },
    },
    {
        displayName: 'Chess.com Computer Analysis',
        description:
            "Your PGN appears to contain automated Chess.com computer analysis. Avoid using the computer until after you've completed your own analysis, or don't use it at all.",
        predicate: (_, move) => {
            return (
                !!move &&
                (ChesscomCommentAfterRegex.test(move.commentAfter || '') ||
                    ChesscomCommentMoveRegex.test(move.commentMove || ''))
            );
        },
    },
    {
        displayName: 'Lichess Computer Analysis',
        description:
            "Your PGN appears to contain automated Lichess computer analysis. Avoid using the computer until after you've completed your own analysis, or don't use it at all.",
        predicate: (_, move) => {
            return !!move && LichessCommentAfterRegex.test(move.commentAfter || '');
        },
    },
];

export function getWarnings(chess: Chess | undefined): Record<string, Warning> {
    if (!chess) {
        return {};
    }
    return getWarningsRecursive(chess, null);
}

function getWarningsRecursive(chess: Chess, move: Move | null): Record<string, Warning> {
    const result: Record<string, Warning> = {};

    for (const rule of rules) {
        if (rule.predicate(chess, move)) {
            if (result[rule.displayName]) {
                result[rule.displayName].moves.push(move);
            } else {
                result[rule.displayName] = {
                    displayName: rule.displayName,
                    description: rule.description,
                    moves: [move],
                };
            }
        }
    }

    for (const variation of move?.variations || []) {
        const recursiveResults = getWarningsRecursive(chess, variation[0]);
        for (const [displayName, warning] of Object.entries(recursiveResults)) {
            if (result[displayName]) {
                result[displayName].moves.push(...warning.moves);
            } else {
                result[displayName] = warning;
            }
        }
    }

    if (chess.nextMove(move)) {
        const recursiveResults = getWarningsRecursive(chess, chess.nextMove(move));
        for (const [displayName, warning] of Object.entries(recursiveResults)) {
            if (result[displayName]) {
                result[displayName].moves.push(...warning.moves);
            } else {
                result[displayName] = warning;
            }
        }
    }

    return result;
}
