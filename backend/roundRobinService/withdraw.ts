'use strict';

import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    RoundRobin,
    RoundRobinPlayerStatuses,
    RoundRobinStatuses,
    RoundRobinWithdrawRequest,
    RoundRobinWithdrawSchema,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from 'chess-dojo-directory-service/api';
import {
    and,
    attributeExists,
    dynamo,
    sizeLessThan,
    UpdateItemBuilder,
} from 'chess-dojo-directory-service/database';
import { tournamentsTable } from './register';

/**
 * Handles requests to withdraw from the round robin. If the tournament is the waitlist,
 * the user is completely removed from the tournament. If the tournament is already
 * running, the user's status is set to withdrawn.
 * @param event The API gateway event that triggered the request.
 * @returns The updated tournament.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, RoundRobinWithdrawSchema);
        const { username } = requireUserInfo(event);
        const tournament = await withdraw({ username, request });
        return success(tournament);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Withdraws the given user from the given round robin tournament.
 * If the tournament is the waitlist, the user is completely removed
 * from the tournament. If the tournament is already running, the user's
 * status is set to withdrawn.
 * @param username The username of the person withdrawing.
 * @param request The round robin withdrawal request.
 * @returns The updated round robin.
 */
async function withdraw({
    username,
    request,
}: {
    username: string;
    request: RoundRobinWithdrawRequest;
}) {
    const builder = new UpdateItemBuilder()
        .key('type', `ROUND_ROBIN_${request.cohort}`)
        .key('startsAt', request.startsAt)
        .table(tournamentsTable)
        .return('ALL_NEW');

    if (request.startsAt === RoundRobinStatuses.WAITING) {
        builder.remove(['players', username]);
        builder.condition(
            and(
                attributeExists(['players', username]),
                sizeLessThan('players', MAX_ROUND_ROBIN_PLAYERS)
            )
        );
    } else {
        builder.set(['players', username, 'status'], RoundRobinPlayerStatuses.WITHDRAWN);
        builder.condition(attributeExists(['players', username]));
    }

    const input = builder.build();
    console.log('Input: %j', input);

    try {
        const result = await dynamo.send(input);
        return unmarshall(result.Attributes!) as RoundRobin;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'This tournament has been updated by someone else. Please refresh and try again.',
            });
        }
        throw err;
    }
}
