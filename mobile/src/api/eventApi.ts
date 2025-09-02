import axios, { AxiosResponse } from 'axios';

import { getConfig } from '@/config';
import { Event } from '../database/event';

const BASE_URL = getConfig().api.baseUrl;

/**
 * EventApiContextType provides an API for interacting with Events.
 */
export type EventApiContextType = {
    /**
     * bookEvent books the provided Event. If the Event is 1 on 1, then startTime
     * and type can also be included in the request.
     * @param id The id of the Event that the user wants to book.
     * @param startTime The time the user wants the meeting to start. Ignored unless the Event is 1 on 1.
     * @param type The type of meeting the user wants to book. Ignored unless the Event is 1 on 1.
     * @returns An AxiosResponse containing the updated Event.
     */
    bookEvent: (
        id: string,
        startTime?: Date,
        type?: string
    ) => Promise<AxiosResponse<Event, any>>;

    /**
     * cancelEvent cancels the Event with the provided id.
     * @param id The Event id to cancel.
     * @returns An AxiosReponse containing the updated Event.
     */
    cancelEvent: (id: string) => Promise<AxiosResponse<Event, any>>;

    /**
     * deleteEvent deletes the provided Event from the database.
     * @param id The id of the Event to delete.
     * @returns An AxiosResponse containing the deleted Event.
     */
    deleteEvent: (id: string) => Promise<AxiosResponse<Event, any>>;

    /**
     * getEvent returns the Event with the provided id.
     * @param id The Event id to fetch.
     * @returns An AxiosResponse containing the Event.
     */
    getEvent: (id: string) => Promise<AxiosResponse<Event, any>>;

    /**
     * listEvents returns a list of all upcoming Events. If the current user is not logged in,
     * only public events are returned.
     * @param startKey The first startKey to use when searching for Events.
     * @returns A list of Events.
     */
    listEvents: (startKey?: string) => Promise<Event[]>;

    /**
     * setEvent saves and returns the provided Event in the database.
     * @param event The Event to save.
     * @returns An AxiosResponse containing the Event as saved in the database.
     */
    setEvent: (event: Event) => Promise<AxiosResponse<Event, any>>;
};

/**
 * bookEvent books the provided Event. If the Event is 1 on 1, then startTime
 * and type can also be included in the request.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the Event that the user wants to book.
 * @param startTime The time the user wants the meeting to start. Ignored unless the Event is 1 on 1.
 * @param type The type of meeting the user wants to book. Ignored unless the Event is 1 on 1.
 * @returns An AxiosResponse containing the updated Event.
 */
export function bookEvent(idToken: string, id: string, startTime?: Date, type?: string) {
    return axios.put<Event>(
        `${BASE_URL}/event/${id}/book`,
        {
            startTime: startTime?.toISOString(),
            type,
        },
        { headers: { Authorization: 'Bearer ' + idToken } }
    );
}

/**
 * cancelEvent cancels the Event with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The Event id to cancel.
 * @returns An AxiosReponse containing the updated Event.
 */
export function cancelEvent(idToken: string, id: string) {
    return axios.put<Event>(
        `${BASE_URL}/event/${id}/cancel`,
        {},
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
}

/**
 * deleteEvent deletes the provided Event from the database.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the Event to delete.
 * @returns An AxiosResponse containing the deleted Event.
 */
export function deleteEvent(idToken: string, id: string) {
    return axios.delete<Event>(`${BASE_URL}/event/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * getEvent returns the Event with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The Event id to fetch.
 * @returns An AxiosResponse containing the Event.
 */
export function getEvent(idToken: string, id: string) {
    return axios.get<Event>(`${BASE_URL}/event/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

interface ListEventsResponse {
    events: Event[];
    lastEvaluatedKey: string;
}

/**
 * listEvents returns a list of all upcoming Events.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The first startKey to use when searching for Events.
 * @returns A list of Events.
 */
export async function listEvents(idToken: string, startKey?: string) {
    let params = { startKey };
    const result: Event[] = [];

    do {
        const resp = await axios.get<ListEventsResponse>(
            idToken ? `${BASE_URL}/event` : `${BASE_URL}/public/event`,
            {
                params,
                headers: idToken
                    ? {
                          Authorization: 'Bearer ' + idToken,
                      }
                    : undefined,
            }
        );

        result.push(...resp.data.events);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * setEvent saves and returns the provided Event in the database.
 * @param idToken The id token of the current signed-in user.
 * @param event The Event to save.
 * @returns An AxiosResponse containing the Event as saved in the database.
 */
export function setEvent(idToken: string, event: Event) {
    return axios.put<Event>(`${BASE_URL}/event`, event, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}
