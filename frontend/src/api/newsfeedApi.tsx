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

    /**
     * Adds the given content as a comment on the given TimelineEntry.
     * @param owner The owner of the TimelineEntry.
     * @param id The id of the TimelineEntry.
     * @param content The text content of the comment.
     * @returns The updated TimelineEntry.
     */
    createNewsfeedComment: (
        owner: string,
        id: string,
        content: string
    ) => Promise<AxiosResponse<TimelineEntry, any>>;

    /**
     * Sets the provided reaction types on the given TimelineEntry.
     * @param owner The owner of the TimelineEntry.
     * @param id The id of the TimelineEntry.
     * @param types The reaction types to set. An empty list deletes the reaction.
     * @returns An AxiosResponse containing the updated TimelineEntry.
     */
    setNewsfeedReaction: (
        owner: string,
        id: string,
        types: string[]
    ) => Promise<AxiosResponse<TimelineEntry, any>>;
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

/**
 * Adds the given content as a comment on the given TimelineEntry.
 * @param idToken The id token of the current signed-in user.
 * @param owner The owner of the TimelineEntry.
 * @param id The id of the TimelineEntry.
 * @param content The text content of the comment.
 * @returns The updated TimelineEntry.
 */
export function createNewsfeedComment(
    idToken: string,
    owner: string,
    id: string,
    content: string
) {
    return axios.post<TimelineEntry>(
        `${BASE_URL}/newsfeed/${owner}/${id}/comments`,
        { content },
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
}

/**
 * Sets the provided reaction types on the given TimelineEntry.
 * @param idToken The id token of the current signed-in user.
 * @param owner The owner of the TimelineEntry.
 * @param id The id of the TimelineEntry.
 * @param types The reaction types to set. An empty list deletes the reaction.
 * @returns An AxiosResponse containing the updated TimelineEntry.
 */
export function setNewsfeedReaction(
    idToken: string,
    owner: string,
    id: string,
    types: string[]
) {
    return axios.put<TimelineEntry>(
        `${BASE_URL}/newsfeed/${owner}/${id}/reactions`,
        { types },
        { headers: { Authorization: 'Bearer ' + idToken } }
    );
}
