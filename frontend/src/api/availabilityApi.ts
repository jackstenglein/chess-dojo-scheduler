import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Availability } from '../database/availability';
import { Meeting } from '../database/meeting';

const BASE_URL = getConfig().api.baseUrl;

/**
 * AvailabilityApiContextType provides an API for interacting with the current
 * signed-in user's availabilities.
 */
export type AvailabilityApiContextType = {
    /**
     * setAvailability saves and returns the provided Availability in the database.
     * @param availability The Availability to save.
     * @returns An AxiosResponse containing the Availability as saved in the database.
     */
    setAvailability: (
        availability: Availability
    ) => Promise<AxiosResponse<Availability, any>>;

    /**
     * deleteAvailability deletes the provided availability from the database.
     * @param id The id of the availability to delete.
     * @returns An AxiosResponse containing no data.
     */
    deleteAvailability: (id: string) => Promise<AxiosResponse<null, any>>;

    /**
     * getAvailabilities returns a list of the currently signed-in user's availabilities matching the provided
     * GetAvailabilityRequest object.
     * @param limit The max amount of items to fetch per page.
     * @param startKey The first startKey to use when searching.
     * @returns A list of availabilities.
     */
    // getAvailabilities: (limit?: number, startKey?: string) => Promise<Availability[]>;

    /**
     * getAvailabilitiesByTime returns a list of availabilities from other users.
     * @param startTime The startTime to use when searching.
     * @param endTime The endTime to use when searching.
     * @param limit The max amount of items to fetch per page.
     * @param startKey The first startKey to use when searching.
     * @returns A list of availabilities matching the provided request.
     */
    // getAvailabilitiesByTime: (
    //     startTime: string,
    //     limit?: number,
    //     startKey?: string
    // ) => Promise<Availability[]>;

    /**
     * Books the provided availability at the provided start times.
     * @param availability The availability that the user wants to book.
     * @param startTime The time the user wants the meeting to start. Required if the meeting is solo and optional otherwise.
     * @param type The type of meeting the user wants to book. Required if the meeting is solo and optional otherwise.
     * @returns An AxiosResponse containing the created session.
     */
    bookAvailability: (
        availability: Availability,
        startTime?: Date,
        type?: string
    ) => Promise<AxiosResponse<Meeting | Availability, any>>;
};

/**
 * setAvailability saves and returns the provided Availability in the database.
 * @param idToken The id token of the current signed-in user.
 * @param availability The Availability to save.
 * @returns An AxiosResponse containing the Availability as saved in the database.
 */
export function setAvailability(idToken: string, availability: Availability) {
    return axios.put<Availability>(BASE_URL + '/availability', availability, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * deleteAvailability deletes the provided availability from the database.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the availability to delete.
 * @returns An AxiosResponse containing no data.
 */
export function deleteAvailability(idToken: string, id: string) {
    return axios.delete<null>(BASE_URL + `/availability/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

// GetAvailabilitiesResponse represents the raw API response for a GetAvailability request.
interface GetAvailabilitiesResponse {
    availabilities: Availability[];
    lastEvaluatedKey: string;
}

/**
 * getAvailabilities returns a list of the currently signed-in user's availabilities matching the provided
 * GetAvailabilityRequest object.
 * @param idToken The id token of the current signed-in user.
 * @param limit The max amount of items to fetch per page.
 * @param startKey The first startKey to use when searching.
 * @returns A list of availabilities.
 */
export async function getAvailabilities(
    idToken: string,
    limit?: number,
    startKey?: string
) {
    let params = { limit: limit || 100, startKey };
    const result: Availability[] = [];

    do {
        const resp = await axios.get<GetAvailabilitiesResponse>(
            BASE_URL + '/availability',
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            }
        );

        result.push(...resp.data.availabilities);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * getAvailabilitiesByTime returns a list of availabilities from other users.
 * @param idToken The id token of the current signed-in user.
 * @param startTime The startTime to use when searching.
 * @param limit The max amount of items to fetch per page.
 * @param startKey The first startKey to use when searching.
 * @returns A list of availabilities matching the provided request.
 */
export async function getAvailabilitiesByTime(
    idToken: string,
    startTime: string,
    limit?: number,
    startKey?: string
) {
    let params = { startTime, limit: limit || 100, startKey };
    const result: Availability[] = [];
    do {
        const resp = await axios.get<GetAvailabilitiesResponse>(
            BASE_URL + '/availability?byTime=true',
            {
                params,
                headers:
                    idToken.length > 0
                        ? { Authorization: 'Bearer ' + idToken }
                        : undefined,
            }
        );

        result.push(...resp.data.availabilities);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * Books the provided availability at the provided start time.
 * @param idToken The id token of the current signed-in user.
 * @param availability The availability that the user wants to book.
 * @param startTime The time the user wants the meeting to start. Required if the meeting is solo and optional otherwise.
 * @param type The type of meeting the user wants to book. Required if the meeting is solo and optional otherwise.
 * @returns An AxiosResponse containing the created meeting.
 */
export function bookAvailability(
    idToken: string,
    availability: Availability,
    startTime?: Date,
    type?: string
) {
    return axios.put<Meeting | Availability>(
        BASE_URL + '/availability/book',
        {
            owner: availability.owner,
            id: availability.id,
            startTime: startTime?.toISOString(),
            type: type,
        },
        {
            headers: { Authorization: 'Bearer ' + idToken },
        }
    );
}
