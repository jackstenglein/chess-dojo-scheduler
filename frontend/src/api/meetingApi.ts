import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Meeting } from '../database/meeting';
import { User } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

/**
 * MeetingApiContextType provides an API for interacting with the current
 * signed-in user's meetings.
 */
export type MeetingApiContextType = {
    /**
     * getMeeting fetches and returns the Meeting with the provided id.
     * @param id The Meeting id to fetch.
     * @returns An AxiosResponse containing the GetMeetingResponse object.
     */
    getMeeting: (id: string) => Promise<AxiosResponse<GetMeetingResponse, any>>;

    /**
     * cancelMeeting cancels the Meeting with the provided id.
     * @param id The Meeting id to cancel.
     * @returns An AxiosReponse containing the updated meeting.
     */
    cancelMeeting: (id: string) => Promise<AxiosResponse<Meeting, any>>;

    /**
     * listMeetings returns a list of the currently signed-in user's meetings.
     * @param limit The max amount of items to fetch per page.
     * @param startKey The first startKey to use when searching for meetings.
     * @returns
     */
    listMeetings: (limit?: number, startKey?: string) => Promise<Meeting[]>;
};

// The response from a GetMeeting request.
export interface GetMeetingResponse {
    meeting: Meeting;
    opponent: User;
}

/**
 * getMeeting fetches and returns the Meeting with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The Meeting id to fetch.
 * @returns An AxiosResponse containing the GetMeetingResponse object.
 */
export function getMeeting(idToken: string, id: string) {
    return axios.get<GetMeetingResponse>(`${BASE_URL}/meeting/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

/**
 * cancelMeeting cancels the Meeting with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The Meeting id to cancel.
 * @returns An AxiosReponse containing the updated meeting.
 */
export function cancelMeeting(idToken: string, id: string) {
    return axios.put<Meeting>(
        `${BASE_URL}/meeting/cancel/${id}`,
        {},
        {
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        }
    );
}

interface ListMeetingsResponse {
    meetings: Meeting[];
    lastEvaluatedKey: string;
}

/**
 * listMeetings returns a list of the currently signed-in user's meetings.
 * @param idToken The id token of the current signed-in user.
 * @param limit The max amount of items to fetch per page.
 * @param startKey The first startKey to use when searching for meetings.
 * @returns
 */
export async function listMeetings(idToken: string, limit?: number, startKey?: string) {
    let params = { limit: limit || 100, startKey };
    const result: Meeting[] = [];

    do {
        const resp = await axios.get<ListMeetingsResponse>(BASE_URL + '/meeting', {
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
