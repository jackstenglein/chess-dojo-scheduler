import axios, { AxiosResponse } from 'axios';
import { DateTime } from 'luxon';
import { getConfig } from '../config';
import {
    Game,
    GameInfo,
    GameReviewType,
    PositionComment,
    isGameResult,
} from '../database/game';

const BASE_URL = getConfig().api.baseUrl;

export type GameApiContextType = {
    /**
     * createGame saves the provided game in the database.
     * @param req The CreateGameRequest.
     * @returns The newly created Game.
     */
    createGame: (
        req: CreateGameRequest,
    ) => Promise<AxiosResponse<Game | EditGameResponse, any>>;

    /**
     * getGame returns the requested game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @returns An AxiosResponse containing the requested game.
     */
    getGame: (cohort: string, id: string) => Promise<AxiosResponse<Game, any>>;

    /**
     * featureGame sets the featured status of the provided game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @param featured Whether the game is featured or not.
     * @returns An AxiosResponse containing the updated game.
     */
    featureGame: (
        cohort: string,
        id: string,
        featured: string,
    ) => Promise<AxiosResponse<Game, any>>;

    /**
     * updateGame overwrites the PGN data of the provided game.
     * @param idToken The id token of the current signed-in user.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @param req The CreateGameRequest.
     * @returns The updated Game.
     */
    updateGame: (
        cohort: string,
        id: string,
        req: UpdateGameRequest,
    ) => Promise<AxiosResponse<Game | EditGameResponse, any>>;

    /**
     * deleteGame removes the specified game from the database. The caller
     * must be the owner of the game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @returns The delete Game.
     */
    deleteGame: (cohort: string, id: string) => Promise<AxiosResponse<Game, any>>;

    /**
     * listGamesByCohort returns a list of GameInfo objects corresponding to the provided cohort,
     * as well as the next start key for pagination.
     * @param cohort The cohort to search for games in.
     * @param startKey The optional startKey to use when searching.
     * @param startDate The optional startDate to limit the search to.
     * @param endDate The optional endDate to limit the search to.
     * @returns The list of games and the next start key.
     */
    listGamesByCohort: (
        cohort: string,
        startKey?: string,
        startDate?: string,
        endDate?: string,
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * listGamesByOwner returns a list of GameInfo objects owned by the provided user,
     * as well as the next start key for pagination. If the optional player parameter
     * is passed, that user's games will be searched instead of the current user's.
     * @param owner The optional owner to search for. If not specified, the current user is used.
     * @param startKey The optional startKey to use when searching.
     * @param startDate The optional start date to limit the search to.
     * @param endDate The optional end date to limit the search to.
     * @param player The optional player to search instead of the current user.
     * @param color The color to use when searching for a specific player.
     * @returns A list of games matching the provided owner.
     */
    listGamesByOwner: (
        owner?: string,
        startKey?: string,
        startDate?: string,
        endDate?: string,
        player?: string,
        color?: string,
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * listGamesByOpening returns a list of GameInfo objects with the provided ECO code,
     * as well as the next start key for pagination.
     * @param eco The ECO to search for.
     * @param startKey The optional startKey to use when searching.
     * @param startDate The optional start date to limit the search to.
     * @param endDate The optional end date to limit the search to.
     * @returns A list of games matching the provided ECO.
     */
    listGamesByOpening: (
        eco: string,
        startKey?: string,
        startDate?: string,
        endDate?: string,
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * listGamesByPosition returns a list of GameInfo objects matching the provided FEN,
     * as well as the next start key for pagination.
     * @param fen The FEN to search for.
     * @param startKey The optional start key to use for pagination.
     * @returns A list of games matching the provided FEN.
     */
    listGamesByPosition: (
        fen: string,
        startKey?: string,
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * listFeaturedGames returns a list of games featured in the past month.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of featured games.
     */
    listFeaturedGames: (startKey?: string) => Promise<GameInfo[]>;

    /**
     * Returns a list of games submitted for review by the senseis.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of games that are submitted for review.
     */
    listGamesForReview: (
        startKey?: string,
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * createComment adds the given content as a comment on the given game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @param comment The comment to add.
     * @param existingComments Whether the position has existing comments.
     */
    createComment: (
        cohort: string,
        id: string,
        comment: PositionComment,
        existingComments: boolean,
    ) => Promise<AxiosResponse<Game, any>>;

    /**
     * Updates a comment on a game. The full updated game is returned.
     * @param update The update to apply.
     * @returns An AxiosResponse containing the updated game.
     */
    updateComment: (update: UpdateCommentRequest) => Promise<AxiosResponse<Game>>;

    /**
     * Deletes a comment on a game. The full updated game is returned.
     * @param request The deletion request.
     * @returns An AxiosResponse containing the updated game.
     */
    deleteComment: (request: DeleteCommentRequest) => Promise<AxiosResponse<Game>>;

    /**
     * Requests a Sensei review for the provided game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @param reviewType The requested review type.
     * @returns An AxiosResponse containing the Stripe checkout session URL.
     */
    requestReview: (
        cohort: string,
        id: string,
        reviewType: GameReviewType,
    ) => Promise<AxiosResponse<RequestReviewResponse>>;

    /**
     * Marks the provided game as reviewed by the caller. The caller must be an admin.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @returns An AxiosResponse containing the updated game.
     */
    markReviewed: (cohort: string, id: string) => Promise<AxiosResponse<Game>>;
};

export enum GameSubmissionType {
    LichessChapter = 'lichessChapter',
    LichessStudy = 'lichessStudy',
    LichessGame = 'lichessGame',
    ChesscomGame = 'chesscomGame',
    ChesscomAnalysis = 'chesscomAnalysis',
    Manual = 'manual',
    StartingPosition = 'startingPosition',
    Fen = 'fen',
}

export interface CreateGameRequest {
    url?: string;
    pgnText?: string;
    type?: GameSubmissionType;
}

/** The orientation of the board. */
export type BoardOrientation = 'white' | 'black';

export interface UpdateGameRequest extends CreateGameRequest {
    timelineId?: string;
    orientation?: BoardOrientation;
    publish?: boolean;
    unlisted?: boolean;
    headers?: GameHeader;
}

export interface GameHeader {
    white: string;
    black: string;
    date: string;
    result: string;
}

export interface EditGameResponse {
    headers: GameHeader[];
    count: number;
}

export function isGame(obj: Game | EditGameResponse): obj is Game {
    return !('count' in obj);
}

/**
 * createGame saves the provided game in the database.
 * @param idToken The id token of the current signed-in user.
 * @param req The CreateGameRequest.
 * @returns The newly created Game.
 */
export function createGame(idToken: string, req: CreateGameRequest) {
    return axios.post<Game | EditGameResponse>(BASE_URL + '/game2', req, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * getGame returns the requested game.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns An AxiosResponse containing the requested game.
 */
export function getGame(cohort: string, id: string) {
    cohort = encodeURIComponent(cohort);
    id = btoa(id); // Base64 encode id because API Gateway can't handle ? in the id

    return axios.get<Game>(`${BASE_URL}/public/game/${cohort}/${id}`);
}

/**
 * featureGame sets the featured status of the provided game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @param featured Whether the game is featured or not.
 * @returns An AxiosResponse containing the updated game.
 */
export function featureGame(
    idToken: string,
    cohort: string,
    id: string,
    featured: string,
) {
    cohort = encodeURIComponent(cohort);
    id = btoa(id); // Base64 encode id because API Gateway can't handle ? in the id

    return axios.put<Game>(
        BASE_URL + `/game/${cohort}/${id}`,
        {},
        {
            params: {
                featured,
            },
            headers: { Authorization: 'Bearer ' + idToken },
        },
    );
}

/**
 * updateGame overwrites the PGN data of the provided game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @param req The CreateGameRequest.
 * @returns The updated Game.
 */
export function updateGame(
    idToken: string,
    cohort: string,
    id: string,
    req: UpdateGameRequest,
) {
    cohort = encodeURIComponent(cohort);
    // Base64 encode id because API Gateway can't handle ? in the id, even if it is URI encoded
    id = btoa(id);

    return axios.put<Game | EditGameResponse>(BASE_URL + `/game2/${cohort}/${id}`, req, {
        headers: { Authorization: 'Bearer ' + idToken },
    });
}

/**
 * deleteGame removes the specified game from the database. The caller
 * must be the owner of the game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns The delete Game.
 */
export function deleteGame(idToken: string, cohort: string, id: string) {
    cohort = encodeURIComponent(cohort);
    id = btoa(id); // Base64 encode id because API Gateway can't handle ? in the id

    return axios.delete<Game>(BASE_URL + `/game/${cohort}/${id}`, {
        headers: { Authorization: 'Bearer ' + idToken },
    });
}

export interface ListGamesResponse {
    games: GameInfo[];
    lastEvaluatedKey?: string;
}

/**
 * listGamesByCohort returns a list of GameInfo objects corresponding to the provided cohort,
 * as well as the next start key for pagination.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort to search for games in.
 * @param startKey The optional startKey to use when searching.
 * @param startDate The optional startDate to limit the search to.
 * @param endDate The optional endDate to limit the search to.
 * @returns An AxiosResponse containing the list of games and the next start key.
 */
export function listGamesByCohort(
    idToken: string,
    cohort: string,
    startKey?: string,
    startDate?: string,
    endDate?: string,
) {
    let params = { startDate, endDate, startKey };
    cohort = encodeURIComponent(cohort);
    return axios.get<ListGamesResponse>(BASE_URL + `/game/${cohort}`, {
        params,
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * listGamesByOnwer returns a list of GameInfo objects owned by the provided user,
 * as well as the next start key for pagination.
 * @param idToken The id token of the current signed-in user.
 * @param owner The optional owner to search for. If not specified, the current user is used.
 * @param startKey The optional startKey to use when searching.
 * @param startDate The optional start date to limit the search to.
 * @param endDate The optional end date to limit the search to.
 * @param player The optional player to search instead of the current user.
 * @param color The color to use when searching for a specific player.
 */
export function listGamesByOwner(
    idToken: string,
    owner?: string,
    startKey?: string,
    startDate?: string,
    endDate?: string,
    player?: string,
    color?: string,
) {
    let params = { owner, startKey, startDate, endDate, player, color };
    return axios.get<ListGamesResponse>(BASE_URL + '/game', {
        params,
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * listGamesByOpening returns a list of GameInfo objects with the provided ECO code,
 * as well as the next start key for pagination.
 * @param idToken The id token of the current signed-in user.
 * @param eco The ECO to search for.
 * @param startKey The optional startKey to use when searching.
 * @param startDate The optional start date to limit the search to.
 * @param endDate The optional end date to limit the search to.
 * @returns A list of games matching the provided ECO.
 */
export function listGamesByOpening(
    idToken: string,
    eco: string,
    startKey?: string,
    startDate?: string,
    endDate?: string,
) {
    let params = { eco, startKey, startDate, endDate };
    return axios.get<ListGamesResponse>(BASE_URL + '/game/opening', {
        params,
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * listGamesByPosition returns a list of GameInfo objects matching the provided FEN,
 * as well as the next start key for pagination.
 * @param idToken The id token of the current signed-in user.
 * @param fen The FEN to search for.
 * @param startKey The optional start key to use for pagination.
 * @returns A list of games matching the provided FEN.
 */
export function listGamesByPosition(idToken: string, fen: string, startKey?: string) {
    let params = { fen, startKey };
    return axios.get<ListGamesResponse>(BASE_URL + '/game/position', {
        params,
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * listFeaturedGames returns a list of games featured in the past month.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of featured games.
 */
export async function listFeaturedGames(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: GameInfo[] = [];

    do {
        const resp = await axios.get<ListGamesResponse>(BASE_URL + '/game/featured', {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.games);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * Returns a list of games submitted for review by the senseis.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The optional start key to use when searching.
 * @returns A list of games submitted for review.
 */
export function listGamesForReview(idToken: string, startKey?: string) {
    return axios.get<ListGamesResponse>(`${BASE_URL}/game/review`, {
        params: { startKey },
        headers: { Authorization: 'Bearer ' + idToken },
    });
}

/**
 * createComment adds the given content as a comment on the given game.
 * @param commenter The user posting the comment.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @param comment The comment to add.
 * @param existingComments Whether the position has existing comments.
 */
export function createComment(
    idToken: string,
    cohort: string,
    id: string,
    comment: PositionComment,
    existingComments: boolean,
) {
    cohort = encodeURIComponent(cohort);
    id = btoa(id); // Base64 encode id because API Gateway can't handle ? in the id

    return axios.post<Game>(BASE_URL + `/game/${cohort}/${id}`, comment, {
        params: { existingComments },
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

export interface UpdateCommentRequest {
    /** The cohort of the game containing the comment. */
    cohort: string;

    /** The id of the game containing the comment. */
    gameId: string;

    /** The id of the comment to update. */
    id: string;

    /** The normalized FEN of the comment to update. */
    fen: string;

    /** The new text content of the comment, which may contain mention markup. */
    content: string;

    /** A comma-separated list of the parent comment ids. Empty for a top-level comment. */
    parentIds: string;
}

/**
 * Updates a comment on a game. The full updated game is returned.
 * @param idToken The id token of the current signed in user.
 * @param update The update to apply.
 * @returns The updated game.
 */
export function updateComment(idToken: string, update: UpdateCommentRequest) {
    return axios.put<Game>(`${BASE_URL}/game/comment`, update, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

export interface DeleteCommentRequest extends Omit<UpdateCommentRequest, 'content'> {}

/**
 * Deletes a comment on a game. The full updated game is returned.
 * @param idToken The id token of the current signed in user.
 * @param request The deletion request.
 * @returns An AxiosResponse containing the updated game.
 */
export function deleteComment(idToken: string, request: DeleteCommentRequest) {
    return axios.put<Game>(`${BASE_URL}/game/comment/delete`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

interface RequestReviewResponse {
    /** The URL of the Stripe checkout session. */
    url: string;
}

/**
 * Requests a Sensei review for the given game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @param reviewType The requested review type.
 * @returns An AxiosResponse containing the Stripe checkout URL.
 */
export function requestReview(
    idToken: string,
    cohort: string,
    id: string,
    reviewType: GameReviewType,
) {
    return axios.put<RequestReviewResponse>(
        `${BASE_URL}/game/review/request`,
        {
            cohort,
            id,
            type: reviewType,
        },
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        },
    );
}

/**
 * Marks the provided game as reviewed by the caller. The caller must be an admin.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns An AxiosResponse containing the updated game.
 */
export function markReviewed(idToken: string, cohort: string, id: string) {
    return axios.put<Game>(
        `${BASE_URL}/game/review/admin`,
        { cohort, id, reviewed: true },
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}

/**
 * Returns true if the URL matches the given specification.
 * @param url The URL to test.
 * @param hostname The hostname to test against.
 * @param pathParts A list of regular expressions to test each part of the URL against.
 * @returns True if the URL matches the hostname and path parts.
 */
function urlMatches(
    url: string,
    {
        hostname,
        pathParts,
    }: {
        hostname: string;
        pathParts: RegExp[];
    },
): boolean {
    let urlObj: URL | null = null;
    try {
        urlObj = new URL(url.trim());
    } catch (error) {
        return false;
    }

    if (urlObj.hostname !== hostname) {
        return false;
    }

    const parts = urlObj.pathname.split('/').filter((part) => part);
    if (parts.length !== pathParts.length) {
        return false;
    }

    for (const [idx, part] of parts.entries()) {
        const re = pathParts[idx];
        if (!re.test(part)) {
            return false;
        }
    }

    return true;
}

const matchLichessId = /^(\w{8}|\w{12})$/;
const matchChesscomId = /^(\w{10,}|\d+)$/;

/**
 * Returns true if the URL is a Lichess Study URL.
 * Ex: https://lichess.org/study/JIPuIPVG/
 * @param url The URL to test.
 * @returns True if the URL is a Lichess Study URL.
 */
export const isLichessStudyURL = (url: string) =>
    urlMatches(url, {
        hostname: 'lichess.org',
        pathParts: [/^study$/, matchLichessId],
    });

/**
 * Returns true if the URL is a Lichess Game URL.
 * Ex: https://lichess.org/mN1qj7pP/black
 * @param url The URL to test.
 * @returns True if the URL is a Lichess Game URL.
 */
export const isLichessGameURL = (url: string) =>
    urlMatches(url, {
        hostname: 'lichess.org',
        pathParts: [matchLichessId, /^(black|white)$/],
    }) ||
    urlMatches(url, {
        hostname: 'lichess.org',
        pathParts: [matchLichessId],
    });

/**
 * Returns true if the URL is a Lichess Study Chapter URL.
 * Ex: https://lichess.org/study/y14Z6s3N/fqJZzUm8
 * @param url The URL to test.
 * @returns True if the URL is a Lichess Study Chapter URL.
 */
export const isLichessChapterURL = (url: string) =>
    urlMatches(url, {
        hostname: 'lichess.org',
        pathParts: [/^study$/, matchLichessId, matchLichessId],
    });

/**
 * Returns true if the URL is a Chess.com game URL.
 * Ex: https://www.chess.com/game/live/107855985867
 * @param url The URL to test.
 * @returns True if the URL is a Chess.com game URL.
 */
export const isChesscomGameURL = (url: string) =>
    urlMatches(url, {
        hostname: 'www.chess.com',
        pathParts: [/^game$/, /^(live|daily)$/, matchChesscomId],
    });

/**
 * Returns true if the URL is a Chess.com analysis URL.
 * Ex: https://www.chess.com/analysis/game/live/108036079387?tab=review
 * Ex: https://www.chess.com/a/2eUTHynZc2Jtfx?tab=analysis
 * @param url The URL to test.
 * @returns True if the URL is a Chess.com analysis URL.
 */
export const isChesscomAnalysisURL = (url: string) =>
    urlMatches(url, {
        hostname: 'www.chess.com',
        pathParts: [/^analysis$/, /^game$/, /^(pgn|live)$/, matchChesscomId],
    }) ||
    urlMatches(url, {
        hostname: 'www.chess.com',
        pathParts: [/^analysis$/, /^game$/, matchChesscomId],
    }) ||
    urlMatches(url, {
        hostname: 'www.chess.com',
        pathParts: [/^a$/, matchChesscomId],
    });

/**
 * Returns true if the provided date string is a valid PGN date (IE: in the format
 * 2024.12.31).
 * @param date The date to test.
 * @returns True if the date is valid.
 */
export function isValidDate(date?: string) {
    return date && !!DateTime.fromISO(date.replaceAll('.', '-'))?.isValid;
}

/**
 * Strips question marks from the given header value. If the header consists only of
 * question marks, an empty string is returned. Otherwise, the header is returned unchanged.
 * @param header The header to strip question marks from.
 * @returns The stripped header value.
 */
export function stripTagValue(header: string) {
    header = header.trim();
    return header.replaceAll('?', '') === '' ? '' : header;
}

/**
 * Returns true if the game has missing or invalid data required to publish.
 * @param game The game to test.
 * @returns True if the game has missing or invalid data required to publish.
 */
export function isMissingData(game: Game) {
    const h = game.headers;
    return (
        !isGameResult(h.Result) ||
        stripTagValue(h.White) === '' ||
        stripTagValue(h.Black) === '' ||
        !isValidDate(h.Date)
    );
}

/**
 * Parses PGN tag date
 * @param pgnDate the PGN formatted date tag
 * @returns DateTime if valid, otherwise null
 */
export function parsePgnDate(pgnDate?: string): DateTime<true> | null {
    if (!pgnDate) {
        return null;
    }

    const date = DateTime.fromISO(pgnDate.replaceAll('.', '-'));
    if (!date.isValid) {
        return null;
    }

    return date;
}

/**
 * Converts a DateTime to a PGN tag suitable string
 * @param date the DateTime object
 * @returns a PGN tag value suitable to use for e.g. Date
 */
export function toPgnDate(date?: DateTime | null): string | null {
    let pgnDate = date?.toUTC().toISO();
    if (!pgnDate) {
        return null;
    }

    pgnDate = pgnDate.substring(0, pgnDate.indexOf('T'));
    pgnDate = pgnDate.replaceAll('-', '.');

    return pgnDate;
}
