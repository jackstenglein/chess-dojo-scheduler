export enum GameResult {
    White = '1-0',
    Black = '0-1',
    Draw = '1/2-1/2',
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
};

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
