import { getConfig } from '@/config';
import { YearReview } from '@/database/yearReview';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

/**
 * Provides an API for interacting with year reviews.
 */
export interface YearReviewApiContextType {
    /**
     * Fetches the year review for the provided user and year.
     * @param username The username to fetch.
     * @param year The year to fetch.
     * @returns The year review for the given user and year.
     */
    getYearReview: (username: string, year: string) => Promise<AxiosResponse<YearReview>>;
}

/**
 * Fetches the year review for the provided user and year.
 * @param username The username to fetch.
 * @param year The year to fetch.
 * @returns The year review for the given user and year.
 */
export function getYearReview(username: string, year: string) {
    return axios.get<YearReview>(`${BASE_URL}/public/yearreview/${username}/${year}`);
}
