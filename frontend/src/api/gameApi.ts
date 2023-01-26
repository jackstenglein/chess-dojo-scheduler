import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Game } from '../database/game';

const BASE_URL = getConfig().api.baseUrl;

export type GameApiContextType = {
    /**
     * getGame returns the requested game.
     * @param cohort The cohort the game is in.
     * @param id The id of the game.
     * @returns An AxiosResponse containing the requested game.
     */
    getGame: (cohort: string, id: string) => Promise<AxiosResponse<Game, any>>;
};

/**
 * getGame returns the requested game.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort the game is in.
 * @param id The id of the game.
 * @returns An AxiosResponse containing the requested game.
 */
export function getGame(idToken: string, cohort: string, id: string) {
    return axios.get<Game>(BASE_URL + `/game/${cohort}/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
