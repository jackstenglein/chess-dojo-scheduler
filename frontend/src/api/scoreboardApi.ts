import axios from 'axios';

import { getConfig } from '../config';
import { ScoreboardSummary } from '../database/scoreboard';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

/**
 * ScoreboardApiContextType provides an API for fetching the scoreboard.
 */
export interface ScoreboardApiContextType {
    /**
     * Returns the scoreboard data for the given scoreboard type.
     * @param type The scoreboard type to get. Valid values are `dojo`, `following` or a cohort.
     * @returns A list of User or ScoreboardSummary objects.
     */
    getScoreboard: (type: string) => Promise<(User | ScoreboardSummary)[]>;
}

interface GetScoreboardResponse {
    data: (User | ScoreboardSummary)[];
    lastEvaluatedKey: string;
}

/**
 * Returns the scoreboard data for the given scoreboard type.
 * @param idToken The id token of the current signed-in user.
 * @param type The scoreboard type to get. Valid values are `dojo`, `following` or a cohort.
 * @returns A list of User or ScoreboardSummary objects.
 */
export async function getScoreboard(
    idToken: string,
    type: string,
): Promise<(User | ScoreboardSummary)[]> {
    const params = { startKey: '' };
    const result: (User | ScoreboardSummary)[] = [];

    do {
        const resp = await axios.get<GetScoreboardResponse>(
            BASE_URL + `/scoreboard/${type}`,
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            },
        );
        result.push(...resp.data.data);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
