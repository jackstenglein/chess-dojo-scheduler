import axios from 'axios';

import { getConfig } from '../config';
import { Opening } from '../database/opening';

const BASE_URL = getConfig().api.baseUrl;

/**
 * OpeningApiContextType provides an API for interacting with Openings.
 */
export type OpeningApiContextType = {
    /**
     * listOpenings returns a list of all openings in the database.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all openings in the database.
     */
    listOpenings: (startKey?: string) => Promise<Opening[]>;
};

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
