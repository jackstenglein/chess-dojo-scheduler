'use strict';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Game, PositionComment } from '@jackstenglein/chess-dojo-common/src/database/game';
import {
    GameCommentEvent,
    GameReviewEvent,
    NotificationTypes,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { ApiError } from 'chess-dojo-directory-service/api';
import { dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { getNotificationSettings } from './user';

const gameTable = `${process.env.stage}-games`;
const notificationTable = `${process.env.stage}-notifications`;

type GameProjection = Pick<Game, 'cohort' | 'id' | 'headers' | 'positionComments' | 'owner'>;

/**
 * Creates notifications for GameCommentEvents.
 * @param event The event to create notifications for.
 */
export async function handleGameComment(event: GameCommentEvent) {
    const getGameOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                cohort: { S: event.game.cohort },
                id: { S: event.game.id },
            },
            ProjectionExpression: `cohort, #id, headers, positionComments, #owner`,
            ExpressionAttributeNames: {
                '#owner': 'owner',
                '#id': 'id',
            },
            TableName: gameTable,
        }),
    );
    if (!getGameOutput.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `Invalid request: game ${event.game.cohort}/${event.game.id} not found`,
        });
    }

    const game = unmarshall(getGameOutput.Item) as GameProjection;
    const comment = game.positionComments[event.comment.fen]?.[event.comment.id];
    if (!comment) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `Invalid request: comment ${event.comment.fen} / ${event.comment.id} not found`,
        });
    }

    const notifiedUsers = new Set<string>();
    const parentIds = comment.parentIds?.split(',') ?? [];
    let parent: PositionComment | undefined = undefined;
    for (const parentId of parentIds) {
        if (!parent) {
            parent = game.positionComments[comment.fen]?.[parentId];
        } else {
            parent = parent.replies[parentId];
        }

        if (!parent) {
            break;
        }
        if (
            parent.owner.username === comment.owner.username ||
            notifiedUsers.has(parent.owner.username)
        ) {
            continue;
        }

        notifiedUsers.add(parent.owner.username);
        await putCommentReplyNotification(game, parent.owner.username);
    }

    if (!comment.parentIds && comment.owner.username !== game.owner) {
        await putNewCommentNotification(game);
    }
}

/**
 * Saves a game comment reply notification to the database.
 * @param game The game the comment reply was left on.
 * @param username The username to notify.
 */
async function putCommentReplyNotification(game: GameProjection, username: string) {
    const user = await getNotificationSettings(username);
    if (!user) {
        console.error(`Unable to add comment reply notification for user ${username}: not found`);
        return;
    }
    if (user.notificationSettings?.siteNotificationSettings?.disableGameCommentReplies) {
        console.log(`Skipping user ${username} as gameCommentReplies are disabled`);
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', username)
        .key('id', `${NotificationTypes.GAME_COMMENT_REPLY}|${game.cohort}|${game.id}`)
        .set('type', NotificationTypes.GAME_COMMENT_REPLY)
        .set('updatedAt', new Date().toISOString())
        .set('gameCommentMetadata', {
            cohort: game.cohort,
            id: game.id,
            headers: game.headers,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    const result = await dynamo.send(input);
    console.log(`Successfully created gameCommentReply notification for ${username}: `, result);
}

/**
 * Saves a new game comment notification to the database.
 * @param game The game the comment was left on.
 */
async function putNewCommentNotification(game: GameProjection) {
    const user = await getNotificationSettings(game.owner);
    if (!user) {
        console.error(`Unable to add new comment notification for user ${game.owner}: not found`);
        return;
    }
    if (user.notificationSettings?.siteNotificationSettings?.disableGameComment) {
        console.log(`Skipping user ${game.owner} as gameComment is disabled`);
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', game.owner)
        .key('id', `${NotificationTypes.GAME_COMMENT}|${game.cohort}|${game.id}`)
        .set('type', NotificationTypes.GAME_COMMENT)
        .set('updatedAt', new Date().toISOString())
        .set('gameCommentMetadata', {
            cohort: game.cohort,
            id: game.id,
            headers: game.headers,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    const result = await dynamo.send(input);
    console.log(`Successfully created game comment notification for user ${game.owner}: `, result);
}

/**
 * Creates notifications for a completed game review.
 * @param event The event to create notifications for.
 */
export async function handleGameReview(event: GameReviewEvent) {
    const getGameOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                cohort: { S: event.game.cohort },
                id: { S: event.game.id },
            },
            ProjectionExpression: `cohort, #id, headers, #owner, review`,
            ExpressionAttributeNames: {
                '#owner': 'owner',
                '#id': 'id',
            },
            TableName: gameTable,
        }),
    );
    if (!getGameOutput.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `Invalid request: game ${event.game.cohort}/${event.game.id} not found`,
        });
    }

    const game = unmarshall(getGameOutput.Item) as Pick<
        Game,
        'cohort' | 'id' | 'headers' | 'owner' | 'review'
    >;
    const user = await getNotificationSettings(game.owner);
    if (!user) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', user.username)
        .key('id', `${NotificationTypes.GAME_REVIEW_COMPLETE}|${game.cohort}|${game.id}`)
        .set('type', NotificationTypes.GAME_REVIEW_COMPLETE)
        .set('updatedAt', new Date().toISOString())
        .set('gameReviewMetadata', {
            cohort: game.cohort,
            id: game.id,
            headers: game.headers,
            reviewer: game.review?.reviewer,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.GAME_REVIEW_COMPLETE} notification for ${game.owner}`,
    );
}
