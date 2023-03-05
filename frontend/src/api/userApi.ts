import axios, { AxiosResponse } from 'axios';

import { User } from '../database/user';
import { getConfig } from '../config';

const BASE_URL = getConfig().api.baseUrl;

/**
 * UserApiContextType provides an API for interacting with the current signed-in user.
 */
export type UserApiContextType = {
    /**
     * getUser returns the current signed-in user.
     * @returns An AxiosResponse containing the current user in the data field.
     */
    getUser: () => Promise<AxiosResponse<User, any>>;

    /**
     * getUserPublic returns the user with the provided username.
     * @returns An AxiosResponse containing the provided user in the data field.
     */
    getUserPublic: (username: string) => Promise<AxiosResponse<User, any>>;

    /**
     * updateUser applies the given updates to the current signed-in user.
     * @param update The updates to apply.
     * @returns An AxiosResponse containing the updated user in the data field.
     */
    updateUser: (update: Partial<User>) => Promise<AxiosResponse<User, any>>;
};

/**
 * getUser returns the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @returns An AxiosResponse containing the current user in the data field.
 */
export function getUser(idToken: string) {
    return axios.get<User>(BASE_URL + '/user', {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * getUserPublic returns the public information for the provided username.
 * @param username The user to fetch public information for.
 * @returns An AxiosResponse containing the requested user.
 */
export function getUserPublic(username: string) {
    return axios.get<User>(BASE_URL + '/public/user/' + username);
}

/**
 * updateUser applies the given updates to the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @param update The updates to apply.
 * @param callback A callback function to invoke with the update after it has succeeded on the backend.
 * @returns An AxiosResponse containing the updated user in the data field.
 */
export function updateUser(
    idToken: string,
    update: Partial<User>,
    callback: (update: Partial<User>) => void
) {
    return axios
        .put<User>(BASE_URL + '/user', update, {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        })
        .then((result) => {
            callback(update);
            return result;
        });
}
