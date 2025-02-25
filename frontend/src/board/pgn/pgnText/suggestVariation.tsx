import { Chess, Move } from '@jackstenglein/chess';

/**
 * Marks the dojoComment on all moves descended from the root as saved.
 * @param chess The chess instance containing the moves.
 * @param root The root move of the variation.
 */
export function markSuggestedVariationSaved(chess: Chess, root: Move) {
    const stack: Move[] = [];
    stack.push(root);

    while (stack.length > 0) {
        const move = stack.pop();
        const comment = move?.commentDiag?.dojoComment;
        if (comment) {
            chess.setCommand('dojoComment', comment.replace(/,unsaved$/, ''), move);
        }

        if (move?.next) {
            stack.push(move.next);
        }

        for (const variation of move?.variations ?? []) {
            stack.push(variation[0]);
        }
    }
}
