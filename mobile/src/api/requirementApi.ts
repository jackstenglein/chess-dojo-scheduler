import axios, { AxiosResponse } from 'axios';

import { getConfig } from '@/config';
import { Requirement } from '../database/requirement';

const BASE_URL = getConfig().api.baseUrl;

export type RequirementApiContextType = {
    /**
     * getRequirement fetches the requirement with the provided id.
     * @param id The id of the requirement to fetch.
     * @returns The requirement with the provided id.
     */
    getRequirement: (id: string) => Promise<AxiosResponse<Requirement, any>>;

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

    /**
     * setRequirement saves the given requirement. This function can only be called by admins.
     * @param requirement The requirement to save.
     * @returns An AxiosResponse containing the updated Requirement.
     */
    setRequirement: (
        requirement: Requirement
    ) => Promise<AxiosResponse<Requirement, any>>;
};

/**
 * getRequirement fetches the requirement with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the requirement to fetch.
 * @returns The requirement with the provided id.
 */
export function getRequirement(idToken: string, id: string) {
    return axios.get<Requirement>(BASE_URL + `/requirement/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

interface ListRequirementsResponse {
    requirements: Requirement[];
    lastEvaluatedKey: string;
}

/**
 * listRequirements returns a list of requirements matching the provided cohort.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort to search for when matching requirements.
 * @param scoreboardOnly Whether to exclude results that are hidden from the scoreboard.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of requirements matching the provided cohort.
 */
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
            BASE_URL + `/requirements/${cohort}`,
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            }
        );

        result.push(...resp.data.requirements);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * setRequirement saves the given requirement. This function can only be called by admins.
 * @param idToken The id token of the current signed-in user.
 * @param requirement The requirement to save.
 * @returns An AxiosResponse containing the updated Requirement.
 */
export function setRequirement(idToken: string, requirement: Requirement) {
    return axios.put<Requirement>(BASE_URL + `/requirement`, requirement, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
