import { z } from 'zod';
import { SubscriptionTier } from '../database/user';

/** Matches the S3 key of a live class recording. */
export const S3_LIVE_CLASS_KEY_REGEX = new RegExp(
    `^(${SubscriptionTier.GameReview}|${SubscriptionTier.Lecture})/(.*)/(.*) \\((\\d{4}-\\d{2}-\\d{2}).*\\)$`,
);

/** Verifies the type of a request to get a recording. */
export const getRecordingRequestSchema = z.object({
    /** The S3 key of the recording to get. */
    s3Key: z.string().regex(S3_LIVE_CLASS_KEY_REGEX),
});

/** A request to get a recording. */
export type GetRecordingRequest = z.infer<typeof getRecordingRequestSchema>;

/** The data for a live class. */
export interface LiveClass {
    /** The name of the class. */
    name: string;
    /** The type of the class. */
    type: SubscriptionTier.GameReview | SubscriptionTier.Lecture;
    /** The recordings of the class. */
    recordings: {
        /** The date of the recording. */
        date: string;
        /** The S3 key of the recording. */
        s3Key: string;
    }[];
}

/** A cohort of users in the Game & Profile Review tier. */
export interface GameReviewCohort {
    /** The primary key of the DynamoDB table. Always GAME_REVIEW_COHORT. */
    type: 'GAME_REVIEW_COHORT';
    /** The id of the game review cohort. */
    id: string;
    /** The name of the game review cohort. */
    name: string;
    /** The discord channel ID for the cohort. */
    discordChannelId: string;
    /** The members of the cohort. */
    members: Record<string, GameReviewCohortMember>;
}

export interface GameReviewCohortMember {
    /** The username of the member. */
    username: string;
    /** The display name of the member. */
    displayName: string;
    /** The date the member joined the queue. */
    queueDate: string;
}

/** Verifies the type of a request to get a game review cohort. */
export const getGameReviewCohortRequestSchema = z.object({
    /** The id of the cohort to get. */
    id: z.string(),
});

/** A request to get a game review cohort. */
export type GetGameReviewCohortRequest = z.infer<typeof getGameReviewCohortRequestSchema>;
