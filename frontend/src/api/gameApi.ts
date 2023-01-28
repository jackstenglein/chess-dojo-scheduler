import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Game, GameInfo } from '../database/game';

const BASE_URL = getConfig().api.baseUrl;

export type GameApiContextType = {
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
     * @param idToken The id token of the current signed-in user.
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
};

/**
 * getGame returns the requested game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns An AxiosResponse containing the requested game.
 */
export function getGame(idToken: string, cohort: string, id: string) {
    return axios.get<Game>(BASE_URL + `/game`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
            'X-Dojo-Cohort': cohort.replaceAll('%2B', '+'),
            'X-Dojo-Game-Id': id.replaceAll('%3F', '?'),
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
    return axios.get<ListGamesResponse>(BASE_URL + `/games`, {
        params,
        headers: {
            Authorization: 'Bearer ' + idToken,
            'X-Dojo-Cohort': cohort.replaceAll('%2B', '+'),
        },
    });
}
