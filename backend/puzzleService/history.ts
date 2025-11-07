import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getPuzzleHistorySchema } from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    getUserInfo,
    parseEvent,
    success,
} from '../directoryService/api';
import { dynamo } from '../directoryService/database';

const puzzleResultsTable = `${process.env.stage}-puzzle-results`;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = getUserInfo(event);
        const request = parseEvent(event, getPuzzleHistorySchema);
        if (!request.username) {
            request.username = userInfo.username;
        }

        const input: QueryCommandInput = {
            KeyConditionExpression: `#username = :username`,
            ExpressionAttributeNames: { '#username': 'username' },
            ExpressionAttributeValues: { ':username': { S: request.username } },
            TableName: puzzleResultsTable,
            ScanIndexForward: false,
        };
        if (request.startKey) {
            input.ExclusiveStartKey = JSON.parse(request.startKey);
        }
        const output = await dynamo.send(new QueryCommand(input));
        const history = output.Items?.map((item) => unmarshall(item)) ?? [];
        const lastEvaluatedKey = JSON.stringify(output.LastEvaluatedKey);

        return success({ history, lastEvaluatedKey });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
