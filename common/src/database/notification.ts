import { z } from 'zod';

/** The types of events that generate notifications. */
const NotificationEventTypeSchema = z.enum([
    /** A comment is left on a game */
    'GAME_COMMENT',

    /** A user gets a new follower */
    'NEW_FOLLOWER',

    /** A comment is left on a timeline entry */
    'TIMELINE_COMMENT',

    /** An emoji reaction is left on a timeline entry */
    'TIMELINE_REACTION',

    /** Someone requests to join a club */
    'NEW_CLUB_JOIN_REQUEST',

    /** A request to join a club is approved */
    'CLUB_JOIN_REQUEST_APPROVED',

    /** A sensei game review is completed */
    'GAME_REVIEW_COMPLETE',
]);

/** The types of a notification event. */
export const NotificationEventTypes = NotificationEventTypeSchema.enum;

const NewFollowerEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypeSchema.Enum.NEW_FOLLOWER),
    /** The username of the person who was followed. */
    username: z.string(),
    /** The person who followed the given username. */
    follower: z.object({
        /** The username of the follower. */
        username: z.string(),
        /** The display name of the follower. */
        displayName: z.string(),
        /** The cohort of the follower. */
        cohort: z.string(),
    }),
});

export type NewFollowerEvent = z.infer<typeof NewFollowerEventSchema>;

/** The schema of an event that generates notifications. */
export const NotificationEventSchema = z.discriminatedUnion('type', [NewFollowerEventSchema]);

/** An event that generates notifications. */
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

// export const GameCommentMetadata = z
//     .object({
//         // The cohort of the game
//         cohort: DojoCohortSchema,
//         // The sort key of the game
//         id: z.string(),
//         // The headers of the game
//         headers: z.object({}),
//     })
//     .strict();

// export type GameCommentMetadata = z.infer<typeof GameCommentMetadata>;

// export const ReviewerSchema = z
//     .object({
//         username: z.string(),
//         displayName: z.string(),
//         cohort: DojoCohortSchema,
//     })
//     .strict();

// export const GameReviewMetadata = z
//     .object({
//         // The cohort of the game
//         cohort: DojoCohortSchema,
//         // The sort key of the game
//         id: z.string(),
//         // The headers of the game
//         headers: z.object({}),
//         reviewer: ReviewerSchema,
//     })
//     .strict();

// export type GameReviewMetadata = z.infer<typeof GameReviewMetadata>;

// // Metadata for a new follower notification.
// export const NewFollowerMetadata = z
//     .object({
//         // The username of the follower
//         username: z.string(),
//         // The display name of the follower
//         displayName: z.string(),
//         // The cohort of the follower
//         cohort: DojoCohortSchema,
//     })
//     .strict();

// export type NewFollowerMetadata = z.infer<typeof NewFollowerMetadata>;

// export const TimelineCommentMetadata = z
//     .object({
//         // The owner of the timeline entry
//         owner: z.string(),
//         // The id of the timeline entry
//         id: z.string(),
//         // The requirement name of the timeline entry
//         name: z.string(),
//     })
//     .strict();

// export type TimeLineCommentMetadata = z.infer<typeof TimelineCommentMetadata>;

// // Metadata for an explorer game notification.
// export const ExplorerGameMetadata = z
//     .object({
//         // The normalized fen of the position
//         normalizedFen: z.string(),

//         // The cohort of the game
//         cohort: DojoCohortSchema,

//         // The sort key of the game
//         id: z.string(),

//         // The result of the explorer game, not the result of the game
//         result: z.string(),

//         // The headers of the game
//         headers: z.object({}),
//     })
//     .strict();

// export type ExplorerGameMetadata = z.infer<typeof ExplorerGameMetadata>;

// // Metadata for a new request to join a club
// export const ClubMetadata = z
//     .object({
//         // The id of the club
//         id: z.string(),

//         // The name of the club
//         name: z.string(),
//     })
//     .strict();

// export type ClubMetadata = z.infer<typeof ClubMetadata>;

// export const Notification = z
//     .object({
//         username: z.string(),
//         type: NotificationTypeSchema,
//         updatedAt: z.date(),
//         count: z.number(),
//         gameCommentMetadata: GameCommentMetadata.nullable(),
//         gameReviewMetadata: GameReviewMetadata.nullable(),
//         newFollowerMetadata: NewFollowerMetadata.nullable(),
//         timelineCommentMetadata: TimelineCommentMetadata.nullable(),
//         explorerGameMetadata: ExplorerGameMetadata.nullable(),
//         clubMetadata: ClubMetadata.nullable(),
//     })
//     .strict();

// export type Notification = z.infer<typeof Notification>;
