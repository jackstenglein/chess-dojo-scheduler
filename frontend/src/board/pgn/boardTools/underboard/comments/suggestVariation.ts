import { GameApiContextType } from '@/api/gameApi';
import { Game, PositionComment } from '@/database/game';
import { User } from '@/database/user';
import { Chess, Move } from '@jackstenglein/chess';

/**
 * Returns true if the given move is part of a suggested variation.
 * @param move The move to check.
 * @returns True if the given move is part of a suggested variation.
 */
export function isSuggestedVariation(move: Move | null | undefined): boolean {
    return Boolean(move?.commentDiag?.dojoComment);
}

/**
 * Returns true if the given move is part of an unsaved suggested variation.
 * @param move The move to check.
 * @returns True if move is part of an unsaved suggested variation.
 */
export function isUnsavedVariation(move: Move | null | undefined): boolean {
    return Boolean(move?.commentDiag?.dojoComment?.endsWith(',unsaved'));
}

/**
 * Returns true if the given move is part of a variation suggested by the given username.
 * @param username The username to check.
 * @param move The move to check.
 */
export function isVariationSuggestor(
    username: string | undefined,
    move: Move | null | undefined,
): boolean {
    return Boolean(username && move?.commentDiag?.dojoComment?.startsWith(username));
}

/**
 * Marks the dojoComment on all moves descended from the root as saved.
 * @param chess The chess instance containing the moves.
 * @param root The root move of the variation.
 * @param commentId The id of the comment the variation is part of.
 */
function markSuggestedVariationSaved(chess: Chess, root: Move, commentId: string) {
    const stack: Move[] = [];
    stack.push(root);

    while (stack.length > 0) {
        const move = stack.pop();
        const comment = move?.commentDiag?.dojoComment;
        if (comment) {
            chess.setCommand('dojoComment', comment.replace(/,unsaved$/, `,${commentId}`), move);
        }

        if (move?.next) {
            stack.push(move.next);
        }

        for (const variation of move?.variations ?? []) {
            stack.push(variation[0]);
        }
    }
}

/**
 * Saves the variation suggested by the given move as a comment on the given game. If successful,
 * the suggested variation is marked as saved.
 * @param user The user creating the comment. If undefined, this function returns immediately.
 * @param game The game to save the comment on. If undefined, this function returns immediately.
 * @param api The api object to use when saving the comment.
 * @param chess The chess object the move is part of.
 * @param move The move containing the suggested variation. Does not need to be the root of the variation.
 * @returns The updated game object, if successful.
 */
export async function saveSuggestedVariation(
    user: User | undefined,
    game: Game | undefined,
    api: GameApiContextType,
    chess: Chess,
    move: Move,
) {
    if (!user || !game) {
        return;
    }

    let root = move;
    while (
        root.previous &&
        (isUnsavedVariation(root.previous) ||
            root.previous.commentDiag?.dojoComment?.startsWith(user.username))
    ) {
        root = root.previous;
    }

    const suggestion = chess.renderFrom(root, {
        skipHeader: true,
        skipComments: true,
    });

    if (isUnsavedVariation(root)) {
        const positionComment: PositionComment = {
            id: '',
            fen: chess.normalizedFen(root.previous),
            ply: root.previous?.ply || 0,
            san: root.previous?.san,
            owner: {
                username: user.username,
                displayName: user.displayName,
                cohort: user.dojoCohort,
                previousCohort: user.previousCohort,
            },
            createdAt: '',
            updatedAt: '',
            content: '',
            parentIds: '',
            replies: {},
            suggestedVariation: suggestion,
        };
        const existingComments = Boolean(game.positionComments[positionComment.fen]);
        const response = await api.createComment(
            game.cohort,
            game.id,
            positionComment,
            existingComments,
        );
        markSuggestedVariationSaved(chess, root, response.data.comment.id);
        return response.data;
    }

    const commentId = root.commentDiag?.dojoComment.substring(
        root.commentDiag.dojoComment.lastIndexOf(',') + 1,
    );
    const comment = game.positionComments[chess.normalizedFen(root.previous)][commentId || ''];
    if (!comment) {
        return;
    }

    const response = await api.updateComment({
        cohort: game.cohort,
        gameId: game.id,
        id: comment.id,
        fen: comment.fen,
        content: comment.content,
        parentIds: comment.parentIds || '',
        suggestedVariation: suggestion,
    });

    markSuggestedVariationSaved(chess, root, comment.id);
    return { game: response.data };
}
