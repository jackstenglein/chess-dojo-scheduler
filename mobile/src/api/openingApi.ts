import axios, { AxiosResponse } from 'axios';

import { getConfig } from '@/config';
import { Course } from '../database/opening';

const BASE_URL = getConfig().api.baseUrl;

/**
 * OpeningApiContextType provides an API for interacting with Openings.
 */
export type OpeningApiContextType = {
    /**
     * getCourse returns the opening course with the provided id.
     * @param id The id of the course to fetch
     * @returns An AxiosResponse containing the requested course.
     */
    getCourse: (id: string) => Promise<AxiosResponse<Course>>;

    /**
     * listCourses returns a list of all opening courses in the database.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all courses in the database.
     */
    listCourses: (startKey?: string) => Promise<Course[]>;
};

/**
 * getCourse returns the opening course with the provided id.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the course to fetch
 * @returns An AxiosResponse containing the requested course.
 */
export function getCourse(idToken: string, id: string) {
    return axios.get<Course>(`${BASE_URL}/openings/${id}`, {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

interface ListCoursesResponse {
    courses: Course[];
    lastEvaluatedKey: string;
}

/**
 * listCourses returns a list of all opening courses in the database.
 * @param idToken The id token of the current signed-in user.
 * @param startKey The optional start key to use when searching.
 * @returns A list of all courses in the database.
 */
export async function listCourses(idToken: string, startKey?: string) {
    const params = { startKey };
    const result: Course[] = [];

    do {
        const resp = await axios.get<ListCoursesResponse>(`${BASE_URL}/openings`, {
            params,
            headers: {
                Authorization: 'Bearer ' + idToken,
            },
        });

        result.push(...resp.data.courses);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
