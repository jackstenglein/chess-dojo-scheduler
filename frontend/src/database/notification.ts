import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import {
    Notification,
    NotificationTypes,
} from '@jackstenglein/chess-dojo-common/src/database/notification';

export type { Notification };

/**
 * Returns the title for the given notification.
 * @param notification The notification to get the title for.
 * @returns The title for the given notification.
 */
export function getTitle(notification: Notification): string {
    switch (notification.type) {
        case NotificationTypes.GAME_COMMENT:
        case NotificationTypes.GAME_COMMENT_REPLY:
            return `${notification.gameCommentMetadata?.headers.White} - ${notification.gameCommentMetadata?.headers.Black}`;
        case NotificationTypes.GAME_REVIEW_COMPLETE:
            return `${notification.gameReviewMetadata?.headers.White} - ${notification.gameReviewMetadata?.headers.Black}`;
        case NotificationTypes.NEW_FOLLOWER:
            return 'You have a new follower';
        case NotificationTypes.TIMELINE_COMMENT:
        case NotificationTypes.TIMELINE_REACTION:
            return `${notification.timelineCommentMetadata?.name}`;
        case NotificationTypes.EXPLORER_GAME:
            if (notification.count === 1) {
                return `${notification.explorerGameMetadata?.[0].headers.White} - ${notification.explorerGameMetadata?.[0].headers.Black}`;
            }
            return `${notification.count} new games were added with a position you follow.`;
        case NotificationTypes.NEW_CLUB_JOIN_REQUEST:
            return `${notification.clubMetadata?.name}`;
        case NotificationTypes.CLUB_JOIN_REQUEST_APPROVED:
            return `${notification.clubMetadata?.name}`;
        case NotificationTypes.CALENDAR_INVITE:
            return `You've been invited to an event on the calendar`;
    }
}

export function getDescription(notification: Notification): string {
    const count = notification.count || 1;

    switch (notification.type) {
        case NotificationTypes.GAME_COMMENT:
            return 'There are new comments on your game.';
        case NotificationTypes.GAME_COMMENT_REPLY:
            return count === 1
                ? `There is a new reply to a comment thread you participated in.`
                : `There are ${count} new replies in comment threads you participated in.`;
        case NotificationTypes.GAME_REVIEW_COMPLETE:
            return `${notification.gameReviewMetadata?.reviewer.displayName} reviewed your game. Check the game settings for more info.`;
        case NotificationTypes.NEW_FOLLOWER:
            return `${notification.newFollowerMetadata?.displayName}`;
        case NotificationTypes.TIMELINE_COMMENT:
            return `There ${count !== 1 ? `are ${count}` : 'is a'} new comment${
                count !== 1 ? 's' : ''
            } on your activity.`;
        case NotificationTypes.TIMELINE_REACTION:
            return `There ${count !== 1 ? `are ${count}` : 'is a'} new reaction${
                count !== 1 ? 's' : ''
            } on your activity.`;
        case NotificationTypes.EXPLORER_GAME:
            if (notification.count === 1) {
                return `A new game was added containing a position you follow.`;
            }
            return '';
        case NotificationTypes.NEW_CLUB_JOIN_REQUEST:
            return `There ${count !== 1 ? `are ${count}` : 'is a'} new request${
                count !== 1 ? 's' : ''
            } to join your club.`;
        case NotificationTypes.CLUB_JOIN_REQUEST_APPROVED:
            return 'Your request to join the club was approved.';
        case NotificationTypes.CALENDAR_INVITE: {
            const start = new Date(notification.calendarInviteMetadata?.startTime || '');
            return `${notification.calendarInviteMetadata?.ownerDisplayName} invited you to an event at ${toDojoDateString(start, undefined, undefined)} ${toDojoTimeString(start, undefined, undefined)}`;
        }
    }
}
