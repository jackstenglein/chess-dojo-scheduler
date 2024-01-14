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

    /** The username of the submitter of the game. */
    owner: string;

    /** The display name of the submitter of the game. */
    ownerDisplayName?: string;

    /** The previous cohort of the submitter of the game. */
    ownerPreviousCohort?: string;

    /** The headers of the PGN. */
    headers: Record<string, string>;

    /** Whether the game is featured or not. */
    isFeatured: 'true' | 'false';

    /** If the game is featured, the date time it was featured. */
    featuredAt: string;

    /** The PGN of the game. */
    pgn: string;

    /** The orientation of the game. */
    orientation: GameOrientation;

    /** The comments left on the game. */
    comments: any[];

    /** Whether the game is unlisted. */
    unlisted: boolean;
}

export enum GameOrientation {
    White = 'white',
    Black = 'black',
}

export interface CreateGameRequest {
    type?: GameImportType;
    url?: string;
    pgnText?: string;
    headers?: GameImportHeaders[];
    orientation?: GameOrientation;
}

export interface UpdateGameRequest extends CreateGameRequest {
    cohort: string;
    id: string;
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
}

export enum GameImportType {
    LichessChapter = 'lichessChapter',
    LichessStudy = 'lichessStudy',
    Manual = 'manual',
}

export interface GameImportHeaders {
    white: string;
    black: string;
    date: string;
}
