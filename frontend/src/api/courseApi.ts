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
    getCourse: (type: string, id: string) => Promise<AxiosResponse<GetCourseResponse>>;

    /**
     * listCourses returns a list of all courses with the provided type.
     * @param type The type of the course.
     * @param startKey The optional start key to use when searching.
     * @returns A list of all courses with the provided type.
     */
    listCourses: (type: string, startKey?: string) => Promise<Course[]>;
};

/** A response to a getCourse request. */
export interface GetCourseResponse {
    /** The requested Course. */
    course: Course;

    /**
     * Whether the user is blocked from viewing this course due to missing purchases.
     * If true, the course's chapters attribute will be null.
     */
    isBlocked: boolean;
}

/**
 * getCourse returns the course with the provided type and id.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the course.
 * @param id The id of the course.
 * @returns An AxiosResponse containing the requested course.
 */
export function getCourse(idToken: string, type: string, id: string) {
    return axios.get<GetCourseResponse>(`${BASE_URL}/courses/${type}/${id}`, {
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
