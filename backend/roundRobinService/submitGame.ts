'use strict';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    RoundRobin,
    RoundRobinSubmitGameRequest,
    RoundRobinSubmitGameSchema,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from 'chess-dojo-directory-service/api';
import { attributeExists, dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { getChesscomGame } from 'chess-dojo-pgn-service/game/chesscom';
import { getLichessGame } from 'chess-dojo-pgn-service/game/lichess';
import { tournamentsTable } from './register';

/**
 * Handles requests to submit a game for a round robin tournament.
 * @param event The API Gateway event that triggered the request.
 * @returns The updated tournament.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, RoundRobinSubmitGameSchema);
        const { username } = requireUserInfo(event);
        const tournament = await submitGame({ username, request });
        return success(tournament);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Submits a game into the given round robin.
 * @param username The username of the person submitting the game.
 * @param request The request to submit the game.
 * @returns The updated tournament.
 */
async function submitGame({
    username,
    request,
}: {
    username: string;
    request: RoundRobinSubmitGameRequest;
}) {
    const data = await parseGame(request.url);
    const pairingPath = await findPairingPath({ username, request, data });

    const input = new UpdateItemBuilder()
        .key('type', `ROUND_ROBIN_${request.cohort}`)
        .key('startsAt', request.startsAt)
        .set([...pairingPath, 'result'], data.result)
        .set([...pairingPath, 'url'], request.url)
        .condition(attributeExists(pairingPath))
        .table(tournamentsTable)
        .return('ALL_NEW')
        .build();
    console.log('Input: %j', input);
    const output = await dynamo.send(input);
    return unmarshall(output.Attributes!) as RoundRobin;
}

interface GameData {
    type: 'chesscom' | 'lichess';
    white: string;
    black: string;
    result: '1-0' | '1/2-1/2' | '0-1';
}

/**
 * Fetches the game at the given URL and parses out the necessary data.
 * @param url The URL of the game to fetch.
 * @returns The data from the game.
 */
async function parseGame(url: string): Promise<GameData> {
    let pgn = '';
    if (url.includes('lichess')) {
        pgn = await getLichessGame(url);
    } else if (url.includes('chess.com')) {
        pgn = await getChesscomGame(url);
    } else {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `Invalid URL. Only Lichess and Chess.com URLs are accepted`,
        });
    }

    let data;
    try {
        const chess = new Chess({ pgn });
        data = {
            type: url.includes('lichess') ? 'lichess' : 'chesscom',
            white: chess.header().tags.White,
            black: chess.header().tags.Black,
            result: chess.header().tags.Result,
        };
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Failed to read game data from URL',
            cause: err,
        });
    }

    if (!data.white) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Game data does not have a white username',
        });
    }
    if (!data.black) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Game data does not have a black username',
        });
    }
    if (data.result !== '1-0' && data.result !== '1/2-1/2' && data.result !== '0-1') {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `Invalid game result: ${data.result}`,
        });
    }

    return data as GameData;
}

/**
 * Finds the DynamoDB attribute path to the pairing for the given game.
 * @param username The username of the person submitting the game.
 * @param request The request to submit the game.
 * @param data The data of the game.
 * @returns The DynamoDB attribute path for the pairing.
 */
async function findPairingPath({
    username,
    request,
    data,
}: {
    username: string;
    request: RoundRobinSubmitGameRequest;
    data: GameData;
}) {
    const output = await dynamo.send(
        new GetItemCommand({
            Key: {
                type: { S: `ROUND_ROBIN_${request.cohort}` },
                startsAt: { S: request.startsAt },
            },
            TableName: tournamentsTable,
        })
    );

    if (!output.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: 'Tournament not found',
        });
    }

    const tournament = unmarshall(output.Item) as RoundRobin;
    const field = data.type === 'chesscom' ? 'chesscomUsername' : 'lichessUsername';

    for (let round = 0; round < tournament.pairings.length; round++) {
        for (let i = 0; i < tournament.pairings[round].length; i++) {
            const pairing = tournament.pairings[round][i];

            if (pairing.white === username || pairing.black === username) {
                const white = tournament.players[pairing.white ?? '']?.[field] ?? '';
                const black = tournament.players[pairing.black ?? '']?.[field] ?? '';

                if (
                    white.trim().toLowerCase() === data.white.trim().toLowerCase() &&
                    black.trim().toLowerCase() === data.black.trim().toLowerCase()
                ) {
                    return ['pairings', round, i];
                }
            }
        }
    }

    throw new ApiError({
        statusCode: 400,
        publicMessage: `No pairing found for this game. Make sure you play all games under the usernames in the tournament and with the correct colors. Contact support if you are sure the game is correct.`,
        privateMessage: `Game data: ${JSON.stringify(data, undefined, 2)}`,
    });
}
