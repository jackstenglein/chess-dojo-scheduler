import axios from 'axios';

import { User } from '../database/user';
import { config } from '../config';

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
