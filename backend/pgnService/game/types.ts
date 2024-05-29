/** A game submitted to the Dojo database. */
export interface Game {
    /** The cohort the game belongs to. */
    cohort: string;

    /** The id of the game, in the form date#uuid. */
    id: string;

    /** The name of the player with the white pieces, in lowercase. */
    white: string;

    /** The name of the player with the black pieces, in lowercase. */
    black: string;

    /** The date the game was played. */
    date: string;

    /** The datetime the game was uploaded to the database, in ISO format. */
    createdAt: string;

    /** The datetime the game was last modified, in ISO format. */
    updatedAt: string;

    /** The datetime the game was last changed from unlisted to public, in ISO format. */
    publishedAt?: string;

    /** The username of the submitter of the game. */
    owner: string;

    /** The display name of the submitter of the game. */
    ownerDisplayName?: string;

    /** The previous cohort of the submitter of the game. */
    ownerPreviousCohort?: string;

    /** The headers of the PGN. */
    headers: Record<string, string>;

    /** Whether the game is featured or not. */
    isFeatured?: 'true' | 'false';

    /** If the game is featured, the date time it was featured. */
    featuredAt?: string;

    /** The PGN of the game. */
    pgn: string;

    /** The orientation of the game. */
    orientation: GameOrientation;

    /** The comments left on the game. */
    comments: any[];

    /** A map from the normalized FEN of a position to the comments on that position. */
    positionComments: Record<string, any>;

    /** Whether the game is unlisted. */
    unlisted: boolean;

    /** The ID of the timeline entry associated with this game's publishing. */
    timelineId?: string;
}

/** The default orientation of the game when it is first opened. */
export enum GameOrientation {
    White = 'white',
    Black = 'black',
}

/** A request to create a new Game. */
export interface CreateGameRequest {
    /** The import type of the Game. */
    type?: GameImportType;

    /** The URL to import from, if supported by type. */
    url?: string;

    /** The raw PGN text of the Game, if supported by type. */
    pgnText?: string;
}

/** A request to update an existing Game. */
export interface UpdateGameRequest extends CreateGameRequest {
    /** The cohort the Game is in. */
    cohort: string;

    /** The id of the Game. */
    id: string;

    /** The existing timeline id of the Game. */
    timelineId?: string;

    /** Whether the Game is unlisted. */
    unlisted?: boolean;

    /** Whether to attempt to publish this game */
    publish?: boolean;

    /** The import headers of the Game. */
    headers?: GameImportHeaders;

    /** The default orientation of the Game. */
    orientation?: GameOrientation;
}

export interface GameUpdate {
    /** The datetime the game was last modified, in ISO format. */
    updatedAt: string;

    /** The name of the player with the white pieces, in lowercase. Only included if the PGN changed. */
    white?: string;

    /** The name of the player with the black pieces, in lowercase. Only included if the PGN changed. */
    black?: string;

    /** The date the game was played. Only included if the PGN changed. */
    date?: string;

    /** The headers of the PGN. Only included if the PGN changed. */
    headers?: Record<string, string>;

    /** The PGN of the game. */
    pgn?: string;

    /** The orientation of the game. */
    orientation?: GameOrientation;

    /** Whether the game is unlisted. */
    unlisted?: boolean;

    /** The datetime the game was last changed from unlisted to public, in ISO format. */
    publishedAt?: string | null;

    /** The ID of the timeline entry associated with this game's publishing. */
    timelineId?: string;
}

export enum GameImportType {
    LichessChapter = 'lichessChapter',
    LichessStudy = 'lichessStudy',
    LichessGame = 'lichessGame',
    ChesscomGame = 'chesscomGame',
    ChesscomAnalysis = 'chesscomAnalysis',
    Manual = 'manual',
    StartingPosition = 'startingPosition',
    Fen = 'fen',
}

export interface GameImportHeaders {
    white: string;
    black: string;
    date: string;
    result: string;
}

const dateRegex = /^\d{4}\.\d{2}\.\d{2}$/;

/**
 * Returns true if the given date string is a valid PGN date.
 * PGN dates are considered valid if they are in the form 2024.12.31
 * and are in the past (we allow dates up to 2 days in the future to
 * avoid time zone issues).
 * @param date The PGN date to check.
 * @returns True if date is a valid PGN date.
 */
export function isValidDate(date?: string): boolean {
    if (!date) {
        return false;
    }
    if (!dateRegex.test(date)) {
        return false;
    }

    const d = Date.parse(date.replaceAll('.', '-'));
    if (isNaN(d)) {
        return false;
    }

    const now = new Date();
    now.setDate(now.getDate() + 2);

    if (d > now.getTime()) {
        return false;
    }

    return true;
}

/**
 * Returns true if the given result is a valid PGN result.
 *
 * WARNING: do not confuse this function with isPublishableResult.
 * @param result The result to check.
 * @returns True if the given result is valid.
 */
export function isValidResult(result?: string): boolean {
    return isPublishableResult(result) || result === '*';
}

/**
 * Returns true if the given result can be published on a game.
 * @param result The result to check.
 * @returns True if the given result is publishable.
 */
export function isPublishableResult(result?: string): boolean {
    return result === '1-0' || result === '0-1' || result === '1/2-1/2';
}
