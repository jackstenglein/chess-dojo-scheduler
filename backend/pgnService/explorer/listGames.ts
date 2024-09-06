'use strict';

import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ExplorerGame } from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = `${process.env.stage}-explorer`;
const mastersTable =
    process.env.stage === 'prod' ? 'prod-masters-explorer' : explorerTable;

/**
 * Returns a list of games with the provided FEN. The FEN is normalized before searching for games.
 * @param event The HTTP event prompting this request. Must contain the fen query string parameter.
 * The startKey query string parameter can be included for pagination.
 * @returns A list of games and the lastEvaluatedKey if there are more games on the next page.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    const fen = event.queryStringParameters?.fen;
    if (!fen) {
        return handleError(400, { publicMessage: 'Invalid request: FEN is required' });
    }
    const startKey = event.queryStringParameters?.startKey;
    const masters = event.queryStringParameters?.masters === 'true';

    try {
        const chess = new Chess({ fen });
        const normalizedFen = chess.normalizedFen();

        const queryOutput = await dynamo.send(
            new QueryCommand({
                KeyConditionExpression: `#fen = :fen AND begins_with ( #id, :id )`,
                ExpressionAttributeNames: {
                    '#fen': 'normalizedFen',
                    '#id': 'id',
                },
                ExpressionAttributeValues: {
                    ':fen': { S: normalizedFen },
                    ':id': { S: 'GAME#' },
                },
                ExclusiveStartKey: startKey ? JSON.parse(startKey) : undefined,
                TableName: masters ? mastersTable : explorerTable,
            }),
        );

        const games = queryOutput.Items?.map(
            (item) => (unmarshall(item) as ExplorerGame).game,
        );
        const lastEvaluatedKey = JSON.stringify(queryOutput.LastEvaluatedKey);

        return {
            statusCode: 200,
            body: JSON.stringify({
                games,
                lastEvaluatedKey,
            }),
        };
    } catch (err) {
        console.error(`Failed to list games for FEN ${fen}:`, err);
        return handleError(500, err);
    }
};

function handleError(code: number, err: any): APIGatewayProxyResultV2 {
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
