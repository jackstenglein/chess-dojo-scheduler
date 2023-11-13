'use strict';

import axios from 'axios';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

import { ExplorerPosition, LichessExplorerPosition, normalizeFen } from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';

/**
 * Gets an ExplorerPosition for the provided FEN.
 * @param event The HTTP request that invoked this handler.
 * @returns The Dojo ExplorerPosition and the LichessExplorerPosition for the given FEN.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    const fen = event.queryStringParameters?.fen;
    if (!fen) {
        return handleError(400, { publicMessage: 'Invalid request: FEN is required' });
    }

    try {
        const chess = new Chess({ fen });
        const normalizedFen = normalizeFen(chess.fen());

        const results = await Promise.all([
            fetchFromDojo(normalizedFen),
            fetchFromLichess(normalizedFen),
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                normalizedFen,
                dojo: results[0],
                lichess: results[1],
            }),
        };
    } catch (err) {
        console.error(`Failed to fetch FEN ${fen}:`, err);
        return handleError(500, err);
    }
};

/**
 * Fetches the ExplorerPosition associated with the given FEN from the Dojo database.
 * @param fen The normalized FEN to fetch.
 * @returns An ExplorerPosition for the provided FEN.
 */
async function fetchFromDojo(fen: string): Promise<ExplorerPosition | null> {
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
        return null;
    }

    const position = unmarshall(getItemOutput.Item);
    return position as ExplorerPosition;
}

/**
 * Fetches the data from the Lichess API for the provided FEN.
 * @param fen The FEN to fetch from Lichess.
 * @returns A LichessExplorerPosition for the provided FEN.
 */
async function fetchFromLichess(fen: string): Promise<LichessExplorerPosition | null> {
    try {
        const response = await axios.get<LichessExplorerPosition>(
            'https://explorer.lichess.ovh/lichess',
            {
                params: { fen, topGames: 0, recentGames: 0 },
            }
        );
        return response.data;
    } catch (err) {
        console.error('Failed to get explorer position from Lichess: ', err);
        return null;
    }
}

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
