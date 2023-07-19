import axios from 'axios';

import { getConfig } from '../config';
import { Tournament, TournamentType } from '../database/tournament';

const BASE_URL = getConfig().api.baseUrl;

export type TournamentApiContextType = {
    /**
     * listTournaments fetches a list of tournaments matching the provided type.
     * @param type The type of tournament to fetch.
     * @param startKey An optional start key to use when fetching.
     * @returns A list of tournaments matching the provided type.
     */
    listTournaments: (type: TournamentType, startKey?: string) => Promise<Tournament[]>;
};

interface ListTournamentsResponse {
    tournaments: Tournament[];
    lastEvaluatedKey: string;
}

/**
 * listTournaments fetches a list of tournaments matching the provided type.
 * @param idToken The id token of the current signed in user
 * @param type The type of tournaments to fetch.
 * @param startKey An optional start key to use when fetching.
 * @returns A list of tournaments matching the provided type.
 */
export async function listTournaments(
    idToken: string,
    type: TournamentType,
    startKey?: string
) {
    const params = { type, startKey };
    const result: Tournament[] = [];

    do {
        const resp = await axios.get<ListTournamentsResponse>(`${BASE_URL}/tournaments`, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.tournaments);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
