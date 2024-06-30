'use strict';

import {
    DeleteItemCommand,
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ExplorerPositionFollower } from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';

interface UserInfo {
    username: string;
    email: string;
}

/** A request to create or update an ExplorerPositionFollower. */
interface FollowPositionRequest {
    /** The FEN of the position to update. */
    fen: string;

    /** The minimum cohort to trigger game notifications. */
    minCohort?: string;

    /** The maximum cohort to trigger game notifications. */
    maxCohort?: string;

    /** Whether to disable notifications for variations. */
    disableVariations?: boolean;

    /** Whether to delete an existing ExplorerPositionFollower. */
    unfollow?: boolean;
}

/**
 * Creates, updates or deletes an ExplorerPositionFollower with the provided FEN.
 * @param event The HTTP request that invoked this handler.
 * @returns The new ExplorerPositionFollower or null if request.unfollow is true.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    const userInfo = getUserInfo(event);
    if (!userInfo.username) {
        return handleError(400, {
            publicMessage: 'Invalid request: username is required',
        });
    }

    const request: FollowPositionRequest = JSON.parse(event.body || '');
    if (!request || !request.fen) {
        return handleError(400, { publicMessage: 'Invalid request: fen is required' });
    }

    try {
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
            return {
                statusCode: 200,
                body: 'null',
            };
        }

        const follower: ExplorerPositionFollower = {
            normalizedFen,
            id: `FOLLOWER#${userInfo.username}`,
            minCohort: request.minCohort,
            maxCohort: request.maxCohort,
            disableVariations: request.disableVariations,
        };
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(follower, { removeUndefinedValues: true }),
                TableName: explorerTable,
            }),
        );

        return {
            statusCode: 200,
            body: JSON.stringify(follower),
        };
    } catch (err) {
        console.error(`Failed to follow FEN: ${request.fen}:`, err);
        return handleError(500, err);
    }
};

function getUserInfo(event: any): UserInfo {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
        return {
            username: '',
            email: '',
        };
    }

    return {
        username: claims['cognito:username'] || '',
        email: claims['email'] || '',
    };
}

export function handleError(code: number, err: any): APIGatewayProxyResultV2 {
    console.error(err);

    return {
        statusCode: code,
        isBase64Encoded: false,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(err),
    };
}
