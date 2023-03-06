import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Game, GameInfo } from '../database/game';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

export type GameApiContextType = {
    /**
     * createGame saves the provided game in the database.
     * @param req The CreateGameRequest.
     * @returns The newly created Game.
     */
    createGame: (req: CreateGameRequest) => Promise<AxiosResponse<Game, any>>;

    /**
     * getGame returns the requested game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @returns An AxiosResponse containing the requested game.
     */
    getGame: (cohort: string, id: string) => Promise<AxiosResponse<Game, any>>;

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
        endDate?: string
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
     */
    listGamesByOwner: (
        owner?: string,
        startKey?: string,
        startDate?: string,
        endDate?: string,
        player?: string,
        color?: string
    ) => Promise<AxiosResponse<ListGamesResponse, any>>;

    /**
     * createComment adds the given content as a comment on the given game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @param content The text content of the game.
     */
    createComment: (
        cohort: string,
        id: string,
        content: string
    ) => Promise<AxiosResponse<Game, any>>;
};

export interface CreateGameRequest {
    type: 'lichess' | 'manual';
    url?: string;
    pgnText?: string;
}

/**
 * createGame saves the provided game in the database.
 * @param idToken The id token of the current signed-in user.
 * @param req The CreateGameRequest.
 * @returns The newly created Game.
 */
export function createGame(idToken: string, req: CreateGameRequest) {
    return axios.post<Game>(BASE_URL + '/game', req, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * getGame returns the requested game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns An AxiosResponse containing the requested game.
 */
export function getGame(idToken: string, cohort: string, id: string) {
    const urlCohort = cohort.replaceAll('+', '%2B');
    const urlId = id.replaceAll('?', '%3F');

    return axios.get<Game>(BASE_URL + `/game/${urlCohort}/${urlId}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
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
    endDate?: string
) {
    let params = { startDate, endDate, startKey };
    const urlCohort = cohort.replaceAll('+', '%2B');
    return axios.get<ListGamesResponse>(BASE_URL + `/game/${urlCohort}`, {
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
    color?: string
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
 * createComment adds the given content as a comment on the given game.
 * @param commenter The user posting the comment.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @param content The text content of the game.
 */
export function createComment(
    idToken: string,
    commenter: User,
    cohort: string,
    id: string,
    content: string
) {
    const comment = {
        owner: commenter.username,
        ownerDiscord: commenter.discordUsername,
        ownerCohort: commenter.dojoCohort,
        content: content,
    };

    return axios.post<Game>(BASE_URL + `/game/${cohort}/${id}/comment`, comment, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
