'use strict';

import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { normalizeFen } from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    const fen = event.queryStringParameters?.fen;
    if (!fen) {
        return handleError(400, { publicMessage: 'Invalid request: FEN is required' });
    }

    try {
        const chess = new Chess({ fen });
        const normalizedFen = normalizeFen(chess.fen());

        const getItemOutput = await dynamo.send(
            new GetItemCommand({
                Key: {
                    normalizedFen: { S: normalizedFen },
                    id: { S: 'POSITION' },
                },
                TableName: explorerTable,
            })
        );
        if (!getItemOutput.Item) {
            return handleError(404, { publicMessage: 'Invalid request: FEN not found' });
        }

        const position = unmarshall(getItemOutput.Item);
        return {
            statusCode: 200,
            body: JSON.stringify(position),
        };
    } catch (err) {
        console.error(`Failed to fetch FEN ${fen}:`, err);
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
