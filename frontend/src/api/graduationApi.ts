import axios from 'axios';

import { getConfig } from '../config';
import { Graduation } from '../database/graduation';

const BASE_URL = getConfig().api.baseUrl;

export interface GraduationApiContextType {
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
    listGraduationsByOwner: (username: string, startKey?: string) => Promise<Graduation[]>;

    /**
     * listGraduationsByDate returns a list of all graduations in the past month.
     * @param startKey The optional startKey to use when searching.
     * @returns A list of graduations.
     */
    listGraduationsByDate: (startKey?: string) => Promise<Graduation[]>;
}

interface ListGraduationsResponse {
    graduations: Graduation[];
    lastEvaluatedKey: string;
}

async function listGraduations(url: string, params: Record<string, string | undefined>) {
    const result: Graduation[] = [];

    do {
        const resp = await axios.get<ListGraduationsResponse>(url, {
            params,
        });

        result.push(...resp.data.graduations);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * listGraduationsByCohort returns a list of graduations matching the provided cohort.
 * @param cohort The cohort to search for when matching graduations.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByCohort(cohort: string, startKey?: string) {
    const params = { startKey };
    return listGraduations(BASE_URL + `/public/graduations/${cohort}`, params);
}

/**
 * listGraduationsByOwner returns a list of graduations matching the provided username.
 * @param username The username to search for when matching graduations.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByOwner(username: string, startKey?: string) {
    const params = { startKey };
    return listGraduations(BASE_URL + `/public/graduations/owner/${username}`, params);
}

/**
 * listGraduationsByDate returns a list of all graduations in the past month.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of graduations.
 */
export async function listGraduationsByDate(startKey?: string) {
    const params = { startKey };
    return listGraduations(BASE_URL + `/public/graduations`, params);
}
