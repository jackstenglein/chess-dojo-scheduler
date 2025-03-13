import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    NotificationTypes,
    TimelineCommentEvent,
    TimelineReactionEvent,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { TimelineEntry } from '@jackstenglein/chess-dojo-common/src/database/timeline';
import { ApiError } from 'chess-dojo-directory-service/api';
import { dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { getNotificationSettings } from './user';

const timelineTable = `${process.env.stage}-timeline`;
const notificationTable = `${process.env.stage}-notifications`;

/**
 * Creates notifications for TimelineCommentEvents.
 * @param event The event to create notifications for.
 */
export async function handleTimelineComment(event: TimelineCommentEvent) {
    const getTimelineEntry = await dynamo.send(
        new GetItemCommand({
            Key: {
                owner: { S: event.owner },
                id: { S: event.id },
            },
            TableName: timelineTable,
        }),
    );
    if (!getTimelineEntry.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `timeline entry ${event.owner}/${event.id} not found`,
        });
    }

    const entry = unmarshall(getTimelineEntry.Item) as TimelineEntry;
    const comment = entry.comments?.find((c) => c.id === event.commentId);
    if (!comment) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `comment ${event.commentId} not found in comments: ${entry.comments}`,
        });
    }
    const user = await getNotificationSettings(event.owner);
    if (
        !user ||
        comment.owner === user.username ||
        user.notificationSettings.siteNotificationSettings?.disableNewsfeedComment
    ) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', event.owner)
        .key('id', `${NotificationTypes.TIMELINE_COMMENT}|${entry.id}`)
        .set('type', NotificationTypes.TIMELINE_COMMENT)
        .set('updatedAt', new Date().toISOString())
        .set('timelineCommentMetadata', {
            owner: entry.owner,
            id: entry.id,
            name: entry.requirementName,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.TIMELINE_COMMENT} notification for ${event.owner}`,
    );
}

/**
 * Creates notifications for TimelineReactionEvents.
 * @param event The event to create notifications for.
 */
export async function handleTimelineReaction(event: TimelineReactionEvent) {
    const user = await getNotificationSettings(event.owner);
    if (!user || user.notificationSettings.siteNotificationSettings?.disableNewsfeedReaction) {
        return;
    }

    const getTimelineEntry = await dynamo.send(
        new GetItemCommand({
            Key: {
                owner: { S: event.owner },
                id: { S: event.id },
            },
            TableName: timelineTable,
        }),
    );
    if (!getTimelineEntry.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `timeline entry ${event.owner}/${event.id} not found`,
        });
    }

    const entry = unmarshall(getTimelineEntry.Item) as TimelineEntry;
    const input = new UpdateItemBuilder()
        .key('username', event.owner)
        .key('id', `${NotificationTypes.TIMELINE_REACTION}|${event.id}`)
        .set('type', NotificationTypes.TIMELINE_REACTION)
        .set('updatedAt', new Date().toISOString())
        .set('timelineCommentMetadata', {
            owner: event.owner,
            id: event.id,
            name: entry.requirementName,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.TIMELINE_REACTION} notification for ${event.owner}`,
    );
}
