import { User } from './user';

/**
 * Represents a single row of data in the summary scoreboards
 * (IE: full dojo and follower scoreboards).
 */
export type ScoreboardSummary = Pick<
        User,
        | 'username'
        | 'displayName'
        | 'graduationCohorts'
        | 'previousCohort'
        | 'ratingSystem'
        | 'ratings'
        | 'dojoCohort'
        | 'totalDojoScore'
        | 'minutesSpent'
    >

/**
 * Returns true if the provided object is a ScoreboardSummary.
 * @param obj The object to check.
 * @returns True if the object is a ScoreboardSummary.
 */
export function isScoreboardSummary(obj: any): obj is ScoreboardSummary {
    return obj.progress === undefined;
}
