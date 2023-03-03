import axios from 'axios';

import { getConfig } from '../config';
import { Requirement } from '../database/requirement';

const BASE_URL = getConfig().api.baseUrl;

export type RequirementApiContextType = {
    /**
     * listRequirements returns a list of requirements matching the provided cohort.
     * @param cohort The cohort to search for when matching requirements.
     * @param scoreboardOnly Whether to exclude results that are hidden from the scoreboard.
     * @param startKey The optional startKey to use when searching.
     */
    listRequirements: (
        cohort: string,
        scoreboardOnly: boolean,
        startKey?: string
    ) => Promise<Requirement[]>;
};

interface ListRequirementsResponse {
    requirements: Requirement[];
    lastEvaluatedKey: string;
}

export async function listRequirements(
    idToken: string,
    cohort: string,
    scoreboardOnly: boolean,
    startKey?: string
) {
    let params = { scoreboardOnly, startKey };
    const result: Requirement[] = [];

    do {
        const resp = await axios.get<ListRequirementsResponse>(
            BASE_URL + `/requirement/${cohort}`,
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            }
        );
        console.log('Raw response: ', resp);

        result.push(...resp.data.requirements);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
