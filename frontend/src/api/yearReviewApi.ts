import { AxiosResponse } from 'axios';
import { YearReview } from '../database/yearReview';
import { axiosService } from './axiosService';

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
    return axiosService.get<YearReview>(`/public/yearreview/${username}/${year}`, {
        functionName: 'getYearReview',
    });
}
