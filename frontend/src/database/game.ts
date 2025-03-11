import {
    CommentOwner,
    GameInfo,
    GameKey,
    GameResult,
    GameReview,
    GameReviewStatus,
    GameReviewType,
    PgnHeaders,
    PositionComment,
} from '@jackstenglein/chess-dojo-common/src/database/game';

export { GameResult, GameReviewStatus, GameReviewType };
export type { CommentOwner, GameInfo, GameKey, GameReview, PgnHeaders, PositionComment };

/**
 * Verifies whether the given value is a GameResult.
 * @param result The result to check.
 */
export function isGameResult(result?: string): result is GameResult {
    return !!Object.values(GameResult).find((r) => r === result);
}

export interface Comment {
    owner: string;
    ownerDisplayName: string;
    ownerCohort: string;
    ownerPreviousCohort: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    content: string;
}

export function isDefaultHeader(header: string): boolean {
    return (
        header === 'White' ||
        header === 'WhiteElo' ||
        header === 'Black' ||
        header === 'BlackElo' ||
        header === 'Date' ||
        header === 'Site' ||
        header === 'Result' ||
        header === 'EventDate'
    );
}

export function displayGameReviewType(t: GameReviewType): string {
    switch (t) {
        case GameReviewType.Quick:
            return 'Quick';
        case GameReviewType.Deep:
            return 'Deep Dive';
    }
}
export const MastersCohort = 'masters';
export const MastersOwnerDisplayName = 'Masters DB';
