import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Opening } from '../database/opening';

const BASE_URL = getConfig().api.baseUrl;

/**
 * OpeningApiContextType provides an API for interacting with Openings.
 */
export type OpeningApiContextType = {
    /**
     * getOpening returns the opening with the provided id.
     * @param id The id of the opening to fetch
     * @returns An AxiosResponse containing the requested opening.
     */
    getOpening: (id: string) => Promise<AxiosResponse<Opening>>;

    /**
     * listOpenings returns a list of all openings in the database.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all openings in the database.
     */
    listOpenings: (startKey?: string) => Promise<Opening[]>;
};

/**
 * getOpening returns the opening with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the opening to fetch
 * @returns An AxiosResponse containing the requested opening.
 */
export function getOpening(idToken: string, id: string) {
    return axios.get<Opening>(`${BASE_URL}/openings/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

interface ListOpeningsResponse {
    openings: Opening[];
    lastEvaluatedKey: string;
}

/**
 * listOpenings returns a list of all openings in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The optional start key to use when searching.
 * @returns A list of all openings in the database.
 */
export async function listOpenings(idToken: string, startKey?: string) {
    const params = { startKey };
    const result: Opening[] = [];

    do {
        const resp = await axios.get<ListOpeningsResponse>(`${BASE_URL}/openings`, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.openings);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
