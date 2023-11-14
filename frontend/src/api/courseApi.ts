import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Course } from '../database/course';

const BASE_URL = getConfig().api.baseUrl;

/**
 * CourseApiContextType provides an API for interacting with Courses.
 */
export type CourseApiContextType = {
    /**
     * getCourse returns the course with the provided type and id.
     * @param type The type of the course.
     * @param id The id of the course.
     * @returns An AxiosResponse containing the requested course.
     */
    getCourse: (type: string, id: string) => Promise<AxiosResponse<Course>>;

    /**
     * listCourses returns a list of all courses with the provided type.
     * @param type The type of the course.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all courses with the provided type.
     */
    listCourses: (type: string, startKey?: string) => Promise<Course[]>;
};

/**
 * getCourse returns the course with the provided type and id.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course.
 * @param id The id of the course.
 * @returns An AxiosResponse containing the requested course.
 */
export function getCourse(idToken: string, type: string, id: string) {
    return axios.get<Course>(`${BASE_URL}/courses/${type}/${id}`, {
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
 * listCourses returns a list of all courses with the provided type.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course.
 * @param startKey The optional start key to use when searching.
 * @returns A list of all courses with the provided type.
 */
export async function listCourses(idToken: string, type: string, startKey?: string) {
    const params = { startKey };
    const result: Course[] = [];

    do {
        const resp = await axios.get<ListCoursesResponse>(`${BASE_URL}/courses/${type}`, {
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
