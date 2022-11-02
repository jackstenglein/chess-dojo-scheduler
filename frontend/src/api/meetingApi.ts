import axios, { AxiosResponse } from 'axios';

import { config } from '../config';
import { Meeting } from '../database/meeting';
import { User } from '../database/user';

const BASE_URL = config.api.baseUrl;

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
