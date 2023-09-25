import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Notification } from '../database/notification';

const BASE_URL = getConfig().api.baseUrl;

/**
 * NotificationApiContextType provides an API for interacting with Notifications.
 */
export type NotificationApiContextType = {
    /**
     * listNotifications returns a list of Notifications for the current signed-in user.
     * @param startKey The startKey to use when searching for Notifications.
     * @returns A list of notifications and the next start key.
     */
    listNotifications: (
        startKey?: string
    ) => Promise<AxiosResponse<ListNotificationsResponse, any>>;

    /**
     * deleteNotification deletes the Notification with the provided id.
     * @param id The id of the Notification to delete.
     * @returns An empty AxiosResponse.
     */
    deleteNotification: (id: string) => Promise<AxiosResponse<void, any>>;
};

/**
 * The response from a listNotifications request.
 */
export interface ListNotificationsResponse {
    /** The fetched list of Notifications. */
    notifications: Notification[];

    /** The startKey to use in the next call to listNotifications. */
    lastEvaluatedKey: string;
}

/**
 * listNotifications returns a list of Notifications for the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The startKey to use when searching for Notifications.
 * @returns A list of notifications and the next start key.
 */
export function listNotifications(idToken: string, startKey?: string) {
    return axios.get<ListNotificationsResponse>(`${BASE_URL}/user/notifications`, {
        params: { startKey },
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * deleteNotification deletes the Notification with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the Notification to delete.
 */
export function deleteNotification(idToken: string, id: string) {
    id = encodeURIComponent(id);
    return axios.delete<void>(`${BASE_URL}/user/notifications/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
