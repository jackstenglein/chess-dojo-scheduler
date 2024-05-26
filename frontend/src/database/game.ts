export enum GameResult {
    White = '1-0',
    Black = '0-1',
    Draw = '1/2-1/2',
}

/**
 * Verifies whether the given value is a GameResult.
 * @param result The result to check.
 */
export function isGameResult(result?: any): result is GameResult {
    return result !== undefined && !!Object.values(GameResult).find((r) => r === result);
}

export enum GameReviewStatus {
    Pending = 'PENDING',
    None = '',
}

export enum GameReviewType {
    Quick = 'QUICK',
    Deep = 'DEEP',
}

export interface PgnHeaders {
    White: string;
    WhiteElo?: string;
    Black: string;
    BlackElo?: string;
    Date: string;
    Site: string;
    Result: GameResult;
    [key: string]: string | undefined;
}

export interface GameInfo {
    cohort: string;
    id: string;
    date: string;
    owner: string;
    ownerDisplayName: string;
    ownerPreviousCohort: string;
    headers: PgnHeaders;
    isFeatured: string;
    featuredAt: string;
    createdAt: string;

    /** When the game was last updated. */
    updatedAt?: string;

    /** When the game was last changed from unlisted to public. */
    publishedAt?: string;

    /** Whether the game is unlisted or not. */
    unlisted?: boolean;

    /**
     * The review status of the game. Omitted if the game
     * is not submitted for review.
     */
    reviewStatus?: GameReviewStatus;

    /**
     * The date the user requested a review for this game in ISO
     * format. Omitted if the game was not submitted for review.
     */
    reviewRequestedAt?: string;

    /**
     * The game review metadata. Omitted if the game was not submitted
     * for review.
     */
    review?: GameReview;
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

export interface CommentOwner {
    /** The username of the comment owner. */
    username: string;

    /** The display name of the comment owner. */
    displayName: string;

    /** The current cohort of the comment owner, at the time of creating the comment. */
    cohort: string;

    /** The cohort the comment owner most recently graduated from, at the time of creating the comment. */
    previousCohort: string;
}

export interface PositionComment {
    /** A v4 UUID identifying the comment. */
    id: string;

    /** The normalized FEN of the position the comment was added to. */
    fen: string;

    /** The ply of the position the comment was added to. */
    ply?: number;

    /** The san of the position the comment was added to. */
    san?: string;

    /** The poster of the comment. */
    owner: CommentOwner;

    /** The time the comment was created. */
    createdAt: string;

    /** The time the comment was last updated. */
    updatedAt: string;

    /** The text content of the comment, which may contain mention markup. */
    content: string;

    /** A comma-separated list of the parent comment ids. Empty for a top-level comment. */
    parentIds: string;

    /** Replies to this comment, mapped by their IDs. */
    replies: Record<string, PositionComment>;
}

export type Game = GameInfo & {
    pgn: string;
    comments: Comment[];
    orientation?: 'white' | 'black';
    timelineId?: string;
    positionComments: Record<string, Record<string, PositionComment>>;
};

export interface GameReview {
    /** The type of review requested. */
    type: GameReviewType;

    /**
     * The date the game was reviewed in ISO format. Omitted if the game
     * was not reviewed yet.
     */
    reviewedAt?: string;

    /** The reviewer of the game. */
    reviewer?: {
        /** The username of the reviewer. */
        username: string;

        /** The display name of the reviewer. */
        displayName: string;

        /** The cohort of the reviewer. */
        cohort: string;
    };
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
