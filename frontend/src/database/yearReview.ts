import { RatingHistory, RatingSystem } from './user';

export interface YearReview {
    username: string;
    period: string;
    currentCohort: string;
    displayName: string;
    userJoinedAt: string;
    ratings?: Record<RatingSystem, YearReviewRatingData>;
    graduations?: string[];
    total: YearReviewData;
}

export interface YearReviewRatingData {
    username: string;
    isPreferred: boolean;
    startRating: number;
    currentRating: YearReviewDataPoint;
    ratingChange: number;
    history: RatingHistory[];
}

export interface YearReviewDataPoint {
    value: number;
    percentile: number;
    cohortPercentile: number;
}

export interface YearReviewData {
    dojoPoints: YearReviewDataSection;
    minutesSpent: YearReviewDataSection;
    games: {
        total: YearReviewDataPoint;
        win: YearReviewDataPoint;
        draw: YearReviewDataPoint;
        loss: YearReviewDataPoint;
        analysis: YearReviewDataPoint;
        byPeriod?: Record<string, number>;
    };
}

export interface YearReviewDataSection {
    total: YearReviewDataPoint;
    byPeriod?: Record<string, number>;
    byCategory?: Record<string, number>;
    byTask?: Record<string, number>;
}
