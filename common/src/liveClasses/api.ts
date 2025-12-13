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
