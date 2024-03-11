export enum GameResult {
    White = '1-0',
    Black = '0-1',
    Draw = '1/2-1/2',
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

export type Game = GameInfo & {
    pgn: string;
    comments: Comment[];
    orientation?: 'white' | 'black';
    timelineId?: string;

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
