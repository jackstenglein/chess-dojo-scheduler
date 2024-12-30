'use strict';

import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    RoundRobinListRequest,
    RoundRobinListSchema,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    parseEvent,
    success,
} from 'chess-dojo-directory-service/api';
import { dynamo } from 'chess-dojo-directory-service/database';
import { tournamentsTable } from './register';

/**
 * Handles a request to list round robin tournaments.
 * @param event The API gateway event that triggered the request.
 * @returns A list of tournaments.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, RoundRobinListSchema);
        return success(await fetchTournaments(request));
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Fetches the tournaments described by the given list request.
 * @param request The request to list the tournaments.
 * @returns The list of tournaments and the last evaluated key for pagination.
 */
async function fetchTournaments(request: RoundRobinListRequest) {
    const input: WithRequired<
        QueryCommandInput,
        'ExpressionAttributeNames' | 'ExpressionAttributeValues'
    > = {
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: {
            '#type': 'type',
        },
        ExpressionAttributeValues: {
            ':type': { S: `ROUND_ROBIN_${request.cohort}` },
        },
        TableName: tournamentsTable,
    };

    if (request.status) {
        input.KeyConditionExpression = `#type = :type AND begins_with(#startsAt, :status)`;
        input.ExpressionAttributeNames['#startsAt'] = 'startsAt';
        input.ExpressionAttributeValues[':status'] = { S: request.status };
    }

    if (request.startKey) {
        input.ExclusiveStartKey = marshall(JSON.parse(request.startKey));
    }

    const output = await dynamo.send(new QueryCommand(input));
    return {
        tournaments: output.Items?.map((item) => unmarshall(item)) || [],
        lastEvaluatedKey: output.LastEvaluatedKey,
    };
}
