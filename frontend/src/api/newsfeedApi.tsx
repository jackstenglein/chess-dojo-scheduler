import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { TimelineEntry } from '../database/requirement';

const BASE_URL = getConfig().api.baseUrl;

export type NewsfeedApiContextType = {
    /**
     * Fetches a page of the current user's newsfeed.
     * @param cohort The optional cohort to use for the newsfeed.
     * @param startKey The optional startKey to use for pagination.
     * @returns An AxiosResponse containing the list of newsfeed items and the next start key.
     */
    listNewsfeed: (
        cohort?: string,
        startKey?: string
    ) => Promise<AxiosResponse<ListNewsfeedResponse, any>>;
};

export interface ListNewsfeedResponse {
    entries: TimelineEntry[];
    lastEvaluatedKey: string;
}

/**
 * Fetches a page of the current user's newsfeed.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The optional cohort to use for the newsfeed.
 * @param startKey The optional startKey to use for pagination.
 * @returns An AxiosResponse containing the list of newsfeed items and the next start key.
 */
export function listNewsfeed(idToken: string, cohort?: string, startKey?: string) {
    return axios.get<ListNewsfeedResponse>(`${BASE_URL}/newsfeed`, {
        params: { cohort, startKey },
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
