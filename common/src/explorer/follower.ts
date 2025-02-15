import { z } from 'zod';

export interface ExplorerPositionFollower {
    /** The username of the follower and the hash key of the Dynamo index. */
    follower: string;
    /**
     * The normalized FEN of the followed position and the sort key of the
     * Dynamo index. This is the hash key for the overall table.
     */
    normalizedFen: string;
    /**
     * The sort key of the table, in the form FOLLOWER#username, where
     * FOLLOWER is the literal value `FOLLOWER` and username has the same value
     * as the follower field.
     */
    id: string;
    /** Metadata about the follower's notification preferences. */
    followMetadata?: ExplorerPositionFollowerMetadata;
}

const explorerPositionFollowerMetadataSchema = z.object({
    /** Preferences for games added to the Dojo database. */
    dojo: z.object({
        /** Whether to enable notifications for Dojo games. */
        enabled: z.boolean(),
        /**
         * The minimum cohort the new analysis must be in for the user to be notified
         * (inclusive). If not provided, then there is no minimum cohort.
         */
        minCohort: z.string().optional(),
        /**
         * The maximum cohort the new analysis must be in for the user to be notified
         * (inclusive). If not provided, then there is no maximum cohort.
         */
        maxCohort: z.string().optional(),
        /**
         * Whether to disable notifications if the position only appears in a variation
         * of the analysis and not the mainline.
         */
        disableVariations: z.boolean().optional(),
    }),
    /** Preferences for games added to the Masters database. */
    masters: z.object({
        /** Whether to enable notifications for Masters games. */
        enabled: z.boolean(),
        /** Valid time controls to alert on. If not provided, all time controls are valid. */
        timeControls: z.string().array().optional(),
        /**
         * The minimum average rating (inclusive) of the players to alert on. If not provided,
         * all ratings are valid.
         */
        minAverageRating: z.number().optional(),
    }),
});

export type ExplorerPositionFollowerMetadata = z.infer<
    typeof explorerPositionFollowerMetadataSchema
>;

/** Validates a request to follow or unfollow a position. */
export const followPositionSchema = z.discriminatedUnion('unfollow', [
    z.object({
        /** The un-normalized FEN of the position to unfollow. */
        fen: z.string(),
        /** If true, the position is unfollowed. */
        unfollow: z.literal(true),
    }),
    z.object({
        /** The un-normalized FEN of the position to follow. */
        fen: z.string(),
        /** If false, the position is followed. */
        unfollow: z.literal(false),
        /** The metadata to attach to the followed position. */
        metadata: explorerPositionFollowerMetadataSchema,
    }),
]);

/** A request to follow a position. */
export type FollowPositionRequest = z.infer<typeof followPositionSchema>;
