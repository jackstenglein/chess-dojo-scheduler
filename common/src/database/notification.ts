import { z } from 'zod';

/** The types of events that generate notifications. */
const NotificationEventTypeSchema = z.enum([
    /** A comment is left on a game */
    'GAME_COMMENT',

    /** A sensei game review is completed */
    'GAME_REVIEW_COMPLETE',

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
]);

/** The types of a notification event. */
export const NotificationEventTypes = NotificationEventTypeSchema.enum;

/** The type of a notification event when a comment is left on a game. */
const GameCommentEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.GAME_COMMENT),
    /** The game the comment was left on. */
    game: z.object({
        /** The cohort of the game. */
        cohort: z.string(),
        /** The id of the game. */
        id: z.string(),
    }),
    /** The comment left on the game. */
    comment: z.object({
        /** The normalized FEN the comment was left on. */
        fen: z.string(),
        /** The id of the comment. */
        id: z.string(),
    }),
});

/** The type of a notification event when a comment is left on a game. */
export type GameCommentEvent = z.infer<typeof GameCommentEventSchema>;

/** The type of a notification event when a game review is completed. */
const GameReviewEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.GAME_REVIEW_COMPLETE),
    /** The game the review was left on. */
    game: z.object({
        /** The cohort of the game. */
        cohort: z.string(),
        /** The id of the game. */
        id: z.string(),
    }),
});

/** The type of a notification event when a game review is completed. */
export type GameReviewEvent = z.infer<typeof GameReviewEventSchema>;

/** The type of a notification event when a user gets a new follower. */
const NewFollowerEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.NEW_FOLLOWER),
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

/** The type of a notification event when a user gets a new follower. */
export type NewFollowerEvent = z.infer<typeof NewFollowerEventSchema>;

/** The type of a notification event when a comment is left on a timeline entry. */
export const TimelineCommentEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.TIMELINE_COMMENT),
    /** The owner of the timeline entry that was commented on. */
    owner: z.string(),
    /** The id of the timeline entry that was commented on. */
    id: z.string(),
    /** The id of the comment that was created. */
    commentId: z.string(),
});

/** The type of a notification event when a comment is left on a timeline entry. */
export type TimelineCommentEvent = z.infer<typeof TimelineCommentEventSchema>;

/** The type of a notification event when a reaction is left on a timeline entry. */
export const TimelineReactionEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.TIMELINE_REACTION),
    /** The owner of the timeline entry that was reacted on. */
    owner: z.string(),
    /** The id of the timeline entry that was reacted on. */
    id: z.string(),
});

/** The type of a notification event when a reaction is left on a timeline entry. */
export type TimelineReactionEvent = z.infer<typeof TimelineReactionEventSchema>;

/** The type of a notification event when someone requests to join a club. */
export const ClubJoinRequesetEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.NEW_CLUB_JOIN_REQUEST),
    /** The id of the club that was requested to join. */
    id: z.string(),
    /** The name of the club that was requested to join. */
    name: z.string(),
    /** The owner of the club that was requested to join. */
    owner: z.string(),
});

/** The type of a notification event when someone requests to join a club. */
export type ClubJoinRequestEvent = z.infer<typeof ClubJoinRequesetEventSchema>;

/** The type of a notification event when a request to join a club is approved. */
export const ClubJoinRequestApprovedEventSchema = z.object({
    /** The type of the event. */
    type: z.literal(NotificationEventTypes.CLUB_JOIN_REQUEST_APPROVED),
    /** The id of the club that was joined. */
    id: z.string(),
    /** The name of the club that was joined. */
    name: z.string(),
    /** The user that was approved. */
    username: z.string(),
});

/** The type of a notification event when a request to join a club is approved. */
export type ClubJoinRequestApprovedEvent = z.infer<typeof ClubJoinRequestApprovedEventSchema>;

/** The schema of an event that generates notifications. */
export const NotificationEventSchema = z.discriminatedUnion('type', [
    NewFollowerEventSchema,
    GameCommentEventSchema,
    GameReviewEventSchema,
    TimelineCommentEventSchema,
    TimelineReactionEventSchema,
    ClubJoinRequesetEventSchema,
    ClubJoinRequestApprovedEventSchema,
]);

/** An event that generates notifications. */
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;

/** The types of notifications. */
const NotificationTypeSchema = z.enum([
    /** A comment is left on a game */
    'GAME_COMMENT',

    /** A reply is left on a game comment. */
    'GAME_COMMENT_REPLY',

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

/** The types of notifications. */
export const NotificationTypes = NotificationTypeSchema.enum;
