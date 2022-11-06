import axios from 'axios';

import { User } from '../database/user';
import { getConfig } from '../config';
import { Availability } from '../database/availability';
import { Meeting } from '../database/meeting';

const BASE_URL = getConfig().api.baseUrl;

/**
 * AdminApiContextType provides an API for interacting with the admin functions.
 */
export type AdminApiContextType = {
    /**
     * adminListUsers returns all users in the database.
     * @returns A list of users.
     */
    adminListUsers: (startKey?: string) => Promise<User[]>;

    /**
     * adminListAvailabilities returns all availabilities in the database.
     * @returns A list of availabilities.
     */
    adminListAvailabilities: (startKey?: string) => Promise<Availability[]>;

    /**
     * adminListMeetings returns all meetings in the database.
     * @returns A list of meetings.
     */
    adminListMeetings: (startKey?: string) => Promise<Meeting[]>;
};

interface ListUsersResponse {
    users: User[];
    lastEvaluatedKey: string;
}

/**
 * Returns a list of all users in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The first startKey to use when searching.
 * @returns A list of all users in the database.
 */
export async function adminListUsers(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: User[] = [];

    do {
        const resp = await axios.get<ListUsersResponse>(BASE_URL + '/admin/user', {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.users);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

interface ListAvailabilitiesResponse {
    availabilities: Availability[];
    lastEvaluatedKey: string;
}

/**
 * Returns a list of all availabilities in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The first startKey to use when searching.
 * @returns A list of all availabilities in the database.
 */
export async function adminListAvailabilities(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: Availability[] = [];

    do {
        const resp = await axios.get<ListAvailabilitiesResponse>(
            BASE_URL + '/admin/availability',
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

interface ListMeetingsResponse {
    meetings: Meeting[];
    lastEvaluatedKey: string;
}

/**
 * Returns a list of all meetings in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The first startKey to use when searching.
 * @returns A list of all meetings in the database.
 */
export async function adminListMeetings(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: Meeting[] = [];

    do {
        const resp = await axios.get<ListMeetingsResponse>(BASE_URL + '/admin/meeting', {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.meetings);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
