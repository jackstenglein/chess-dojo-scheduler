import axios from 'axios';

import { getConfig } from '../config';
import { Availability } from '../database/availability';
import { Meeting } from '../database/meeting';

const BASE_URL = getConfig().api.baseUrl;

export interface Calendar {
    meetings: Meeting[];
    availabilities: Availability[];
}

interface GetCalendarResponse {
    meetings: Meeting[];
    availabilities: Availability[];
    lastEvaluatedKey: string;
}

/**
 * CalendarApiContextType provides an API for interacting with the current
 * signed-in user's calendar.
 */
export type CalendarApiContextType = {
    /**
     * getCalendar returns the current signed-in user's calendar.
     * @param startTime The time to start searching.
     * @param startKey The first startKey to use when searching the calendar.
     */
    getCalendar: (startTime: Date, startKey?: string) => Promise<Calendar>;
};

/**
 * getCalendar returns the current signed-in user's calendar.
 * @param idToken The id token of the current signed-in user.
 * @param startTime The time to start searching.
 * @param startKey The first startKey to use when searching the calendar.
 * @returns The current signed-in user's calendar.
 */
export async function getCalendar(idToken: string, startTime: Date, startKey?: string) {
    let params = { startTime: startTime.toISOString(), startKey };
    const result: Calendar = {
        meetings: [],
        availabilities: [],
    };

    do {
        const resp = await axios.get<GetCalendarResponse>(BASE_URL + '/calendar', {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.meetings.push(...resp.data.meetings);
        result.availabilities.push(...resp.data.availabilities);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
