import axios from 'axios';

import { User } from '../database/user';
import { config } from '../config';
import { Availability } from '../database/availability';

const BASE_URL = config.api.baseUrl;

/**
 * AdminApiContextType provides an API for interacting with the admin functions.
 */
export type AdminApiContextType = {
    /**
     * listUsers returns all users in the database.
     * @returns A list of users.
     */
    listUsers: (startKey?: string) => Promise<User[]>;

    /**
     * listAvailabilities returns all availabilities in the database.
     * @returns A list of availabilities.
     */
    listAvailabilities: (startKey?: string) => Promise<Availability[]>;
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
export async function listUsers(idToken: string, startKey?: string) {
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
 * @returns A list of all users in the database.
 */
export async function listAvailabilities(idToken: string, startKey?: string) {
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
