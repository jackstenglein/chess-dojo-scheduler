import axios from 'axios';

import { getConfig } from '@/config';
import { Graduation } from '../database/graduation';

const BASE_URL = getConfig().api.baseUrl;

export type GraduationApiContextType = {
    /**
     * listGraduationsByCohort returns a list of graduations matching the provided cohort.
     * @param cohort The cohort to search for when matching graduations.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of graduations.
     */
    listGraduationsByCohort: (cohort: string, startKey?: string) => Promise<Graduation[]>;

    /**
     * listGraduationsByOwner returns a list of graduations matching the provided username.
     * @param username The username to search for when matching graduations.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of graduations.
     */
    listGraduationsByOwner: (
        username: string,
        startKey?: string
    ) => Promise<Graduation[]>;

    /**
     * listGraduationsByDate returns a list of all graduations in the past month.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of graduations.
     */
    listGraduationsByDate: (startKey?: string) => Promise<Graduation[]>;
};

interface ListGraduationsResponse {
    graduations: Graduation[];
    lastEvaluatedKey: string;
}

async function listGraduations(
    url: string,
    params: Record<string, string | undefined>,
    idToken: string
) {
    const result: Graduation[] = [];

    do {
        const resp = await axios.get<ListGraduationsResponse>(url, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.graduations);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * listGraduationsByCohort returns a list of graduations matching the provided cohort.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort to search for when matching graduations.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByCohort(
    idToken: string,
    cohort: string,
    startKey?: string
) {
    let params = { startKey };
    return listGraduations(BASE_URL + `/graduations/${cohort}`, params, idToken);
}

/**
 * listGraduationsByOwner returns a list of graduations matching the provided username.
 * @param idToken The id token of the current signed-in user.
 * @param username The username to search for when matching graduations.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByOwner(
    idToken: string,
    username: string,
    startKey?: string
) {
    let params = { startKey };
    return listGraduations(BASE_URL + `/graduations/owner/${username}`, params, idToken);
}

/**
 * listGraduationsByDate returns a list of all graduations in the past month.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByDate(idToken: string, startKey?: string) {
    let params = { startKey };
    return listGraduations(BASE_URL + `/graduations`, params, idToken);
}
