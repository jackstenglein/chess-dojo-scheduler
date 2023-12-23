import { RatingHistory, RatingSystem } from './user';

export interface YearReview {
    username: string;
    period: string;
    currentCohort: string;
    displayName: string;
    userJoinedAt: string;
    ratings: Record<RatingSystem, YearReviewRatingData>;
    graduations: string[];
    cohorts: Record<string, YearReviewData>;
    total: YearReviewData;
}

export interface YearReviewRatingData {
    username: string;
    isPreferred: boolean;
    startRating: YearReviewDataPoint;
    currentRating: YearReviewDataPoint;
    ratingChange: YearReviewDataPoint;
    history: RatingHistory[];
}

export interface YearReviewDataPoint {
    value: number;
    percentile: number;
    cohortPercentile: number;
}

export interface YearReviewData {
    startDate: string;
    endDate: string;
    dojoPoints: {
        total: YearReviewDataPoint;
        byPeriod: Record<string, number>;
        byCategory: Record<string, number>;
        byTask: Record<string, number>;
    };
    minutesSpent: {
        total: YearReviewDataPoint;
        byPeriod: Record<string, number>;
        byCategory: Record<string, number>;
        byTask: Record<string, number>;
    };
    games: {
        total: YearReviewDataPoint;
        byPeriod: Record<string, number>;
    };
}
