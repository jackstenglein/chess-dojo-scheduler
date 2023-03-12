import axios from 'axios';

import { getConfig } from '../config';
import { Graduation } from '../database/graduation';

const BASE_URL = getConfig().api.baseUrl;

export type GraduationApiContextType = {
    /**
     * listGraduations returns a list of graduations matching the provided cohort.
     * @param cohort The cohort to search for when matching graduations.
     * @param startKey The optional startKey to use when searching.
     */
    listGraduations: (cohort: string, startKey?: string) => Promise<Graduation[]>;
};

interface ListGraduationsResponse {
    graduations: Graduation[];
    lastEvaluatedKey: string;
}

export async function listGraduations(
    idToken: string,
    cohort: string,
    startKey?: string
) {
    let params = { startKey };
    const result: Graduation[] = [];

    do {
        const resp = await axios.get<ListGraduationsResponse>(
            BASE_URL + `/graduations/${cohort}`,
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            }
        );

        result.push(...resp.data.graduations);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
