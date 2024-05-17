'use strict';

import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    APIGatewayProxyEventV2,
    APIGatewayProxyHandlerV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getChesscomAnalysis, getChesscomGame } from './chesscom';
import { ApiError, errToApiGatewayProxyResultV2 } from './errors';
import { getLichessChapter, getLichessGame, getLichessStudy } from './lichess';
import {
    CreateGameRequest,
    Game,
    GameImportHeaders,
    GameImportType,
    GameOrientation,
    isValidDate,
    isValidResult,
} from './types';

export const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const usersTable = process.env.stage + '-users';
export const gamesTable = process.env.stage + '-games';
export const timelineTable = process.env.stage + '-timeline';

export function success(value: any): APIGatewayProxyResultV2 {
    if (process.env.stage !== 'prod') {
        console.log('Response: %j', value);
    }
    return {
        statusCode: 200,
        body: JSON.stringify(value),
    };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    try {
        const user = await getUser(event);
        const request = getRequest(event);

        let pgnTexts: string[] = [];
        if (request.type === GameImportType.LichessChapter) {
            pgnTexts = [await getLichessChapter(request.url)];
        } else if (request.type === GameImportType.LichessGame) {
            pgnTexts = [await getLichessGame(request.url)];
        } else if (request.type === GameImportType.LichessStudy) {
            pgnTexts = await getLichessStudy(request.url);
        } else if (request.type === GameImportType.ChesscomGame) {
            pgnTexts = [await getChesscomGame(request.url)];
        } else if (request.type === GameImportType.ChesscomAnalysis) {
            pgnTexts = [await getChesscomAnalysis(request.url)];
        } else if (request.type === GameImportType.Manual) {
            if (!request.pgnText) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage:
                        'Invalid request: pgnText is required when importing manual entry',
                });
            }
            pgnTexts = [cleanupChessbasePgn(request.pgnText)];
        } else {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `Invalid request: type ${request.type} not supported`,
            });
        }
        console.log('PGN texts length: ', pgnTexts.length);

        const games = getGames(user, pgnTexts);
        if (games.length === 0) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Invalid request: no games found',
            });
        }

        const updated = await batchPutGames(games);
        if (games.length === 1) {
            return success(games[0]);
        }
        return success({ count: updated });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function getUser(event: APIGatewayProxyEventV2): Promise<Record<string, any>> {
    const userInfo = getUserInfo(event);
    if (!userInfo.username) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: username is required',
        });
    }

    let getItemOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                username: { S: userInfo.username },
            },
            TableName: usersTable,
        }),
    );
    if (!getItemOutput.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: 'Invalid request: user not found',
        });
    }

    const caller = unmarshall(getItemOutput.Item);
    return caller;
}

export function getUserInfo(event: any): { username: string; email: string } {
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

function getRequest(event: APIGatewayProxyEventV2): CreateGameRequest {
    let request: CreateGameRequest;
    try {
        request = JSON.parse(event.body || '{}');
    } catch (err) {
        console.error('Failed to unmarshal body: ', err);
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: body could not be unmarshaled',
            cause: err,
        });
    }

    return request;
}

export function cleanupChessbasePgn(pgn: string): string {
    const startIndex = pgn.indexOf('{[%evp');
    if (startIndex < 0) {
        return pgn;
    }
    return (
        pgn.substring(0, startIndex) +
        pgn.substring(startIndex).replaceAll('\n', ' ').replaceAll('  ', '\n')
    );
}

function getGames(
    user: Record<string, any>,
    pgnTexts: string[],
): Game[] {
    const games: Game[] = [];
    for (let i = 0; i < pgnTexts.length; i++) {
        console.log('Parsing game %d: %s', i + 1, pgnTexts[i]);
        games.push(getGame(user, pgnTexts[i]));
    }
    return games;
}

/**
 * Returns true if the given PGN text has a Variant header containing a value other than 
 * `Standard`.
 * @param pgnText The PGN to test.
 * @returns True if the PGN is a variant.
 */
export function isFairyChess(pgnText: string) {
    return (
        /^\[Variant .*\]$/gim.test(pgnText) &&
        !/^\[Variant\s+['"]?Standard['"]?\s*\]$/gim.test(pgnText)
    );
}

export function getGame(
    user: Record<string, any> | undefined,
    pgnText: string,
    headers?: GameImportHeaders,
): Game {
    // We do not support variants due to current limitations with
    // @JackStenglein/pgn-parser
    if (isFairyChess(pgnText)) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Chess variants are not supported',
            privateMessage: 'Variant header found in PGN text',
        });
    }

    try {
        const chess = new Chess({ pgn: pgnText });
        if (headers?.white) {
            chess.setHeader('White', headers.white);
        }
        if (headers?.black) {
            chess.setHeader('Black', headers.black);
        }
        if (headers?.date) {
            chess.setHeader('Date', headers.date);
        }
        if (headers?.result) {
            chess.setHeader('Result', headers.result);
        }

        chess.setHeader('White', chess.header().White?.trim() || '?');
        chess.setHeader('Black', chess.header().Black?.trim() || '??');
        chess.setHeader('Date', chess.header().Date?.trim().replaceAll('-', '.') || '');
        chess.setHeader('Result', chess.header().Result?.trim() || '*');
        chess.setHeader('PlyCount', `${chess.plyCount()}`);

        if (!isValidDate(chess.header().Date)) {
            chess.setHeader('Date', '');
        }
        if (!isValidResult(chess.header().Result)) {
            chess.setHeader('Result', '*');
        }

        const now = new Date();
        const uploadDate = now.toISOString().slice(0, '2024-01-01'.length);

        return {
                cohort: user?.dojoCohort || '',
                id: `${uploadDate.replaceAll('-', '.')}_${uuidv4()}`,
                white: chess.header().White.toLowerCase(),
                black: chess.header().Black.toLowerCase(),
                date: chess.header().Date,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                owner: user?.username || '',
                ownerDisplayName: user?.displayName || '',
                ownerPreviousCohort: user?.previousCohort || '',
                headers: chess.header(),
                pgn: chess.renderPgn(),
                orientation: GameOrientation.White,
                comments: [],
                positionComments: {},
                unlisted: true,
            }
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid PGN',
            privateMessage: 'Failed to get game',
            cause: err,
        });
    }
}

async function batchPutGames(games: Game[]): Promise<number> {
    const writeRequests = games.map((g) => {
        return {
            PutRequest: {
                Item: marshall(g),
            },
        };
    });

    let updated = 0;
    for (let i = 0; i < writeRequests.length; i += 25) {
        const batch = writeRequests.slice(i, i + 25);
        const result = await dynamo.send(
            new BatchWriteItemCommand({
                RequestItems: {
                    [gamesTable]: batch,
                },
                ReturnConsumedCapacity: 'NONE',
            }),
        );
        if (
            result.UnprocessedItems &&
            Object.values(result.UnprocessedItems).length > 0
        ) {
            throw new ApiError({
                statusCode: 500,
                publicMessage: 'Temporary server error',
                privateMessage: 'DynamoDB BatchWriteItem failed to process',
            });
        }

        updated += batch.length;
    }

    return updated;
}
