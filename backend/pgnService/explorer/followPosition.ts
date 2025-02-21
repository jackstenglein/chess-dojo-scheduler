'use strict';

import { DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    ExplorerPositionFollower,
    followPositionSchema,
} from '@jackstenglein/chess-dojo-common/src/explorer/follower';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from 'chess-dojo-directory-service/api';
import { dynamo } from 'chess-dojo-directory-service/database';
import { explorerTable } from './listGames';

/**
 * Creates, updates or deletes an ExplorerPositionFollower with the provided FEN.
 * @param event The HTTP request that invoked this handler.
 * @returns The new ExplorerPositionFollower or null if request.unfollow is true.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    try {
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, followPositionSchema);

        const chess = new Chess({ fen: request.fen });
        const normalizedFen = chess.normalizedFen();

        if (request.unfollow) {
            await dynamo.send(
                new DeleteItemCommand({
                    Key: {
                        normalizedFen: { S: normalizedFen },
                        id: { S: `FOLLOWER#${userInfo.username}` },
                    },
                    TableName: explorerTable,
                }),
            );
            return success(null);
        }

        const follower: ExplorerPositionFollower = {
            follower: userInfo.username,
            normalizedFen,
            id: `FOLLOWER#${userInfo.username}`,
            followMetadata: request.metadata,
        };
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(follower, { removeUndefinedValues: true }),
                TableName: explorerTable,
            }),
        );
        return success(follower);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
