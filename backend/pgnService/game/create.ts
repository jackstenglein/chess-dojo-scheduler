'use strict';

import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
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

        const [games, headers] = getGames(
            user,
            pgnTexts,
            request.headers,
            request.orientation!,
        );
        if (headers.length > 0) {
            return success({ count: headers.length, headers });
        }

        if (games.length === 0) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Invalid request: no games found',
            });
        }

        const updated = await batchPutGames(games);
        if (games.length === 1) {
            // TODO: create timeline entry
            if (games[0].timelineId) {
                await createTimelineEntry(games[0]);
            }
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

    if (
        request.orientation !== GameOrientation.White &&
        request.orientation !== GameOrientation.Black
    ) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: orientation must be `white` or `black`',
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
    reqHeaders: GameImportHeaders[] | undefined,
    orientation: GameOrientation,
): [Game[], GameImportHeaders[]] {
    const games: Game[] = [];
    const headers: GameImportHeaders[] = [];
    let missingData = false;

    for (let i = 0; i < pgnTexts.length; i++) {
        console.log('Parsing game %d: %s', i + 1, pgnTexts[i]);

        const [game, header] = getGame(user, pgnTexts[i], reqHeaders?.[i], orientation);

        headers.push(header);
        if (!game) {
            missingData = true;
        } else {
            games.push(game);
        }
    }

    if (missingData) {
        return [[], headers];
    }
    return [games, []];
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
    headers: GameImportHeaders | undefined,
    orientation: GameOrientation,
): [Game, GameImportHeaders] {
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

        return [
            {
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
                orientation,
                comments: [],
                positionComments: {},
                unlisted: true,
            },
            {
                white: chess.header().White,
                black: chess.header().Black,
                date: chess.header().Date,
                result: chess.header().Result,
            },
        ];
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid PGN',
            privateMessage: 'Failed to get game',
            cause: err,
        });
    }
}

const dateRegex = /^\d{4}\.\d{2}\.\d{2}$/;

/**
 * Returns true if the given date string is a valid PGN date.
 * PGN dates are considered valid if they are in the form 2024.12.31
 * and are in the past (we allow dates up to 2 days in the future to 
 * avoid time zone issues).
 * @param date The PGN date to check.
 * @returns True if date is a valid PGN date.
 */
function isValidDate(date?: string): boolean {
    if (!date) {
        return false;
    }
    if (!dateRegex.test(date)) {
        return false;
    }

    const d = Date.parse(date.replaceAll('.', '-'));
    if (isNaN(d)) {
        return false;
    }

    const now = new Date();
    now.setDate(now.getDate() + 2);

    if (d > now.getTime()) {
        return false;
    }

    return true;
}

/**
 * Returns true if the given result is a valid PGN result.
 * @param result The result to check.
 * @returns True if the given result is valid.
 */
function isValidResult(result?: string): boolean {
    return result === '1-0' || result === '0-1' || result === '1/2-1/2' || result === '*';
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

export async function createTimelineEntry(game: Game) {
    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall({
                    owner: game.owner,
                    id: game.timelineId,
                    ownerDisplayName: game.ownerDisplayName,
                    requirementId: 'GameSubmission',
                    requirementName: 'GameSubmission',
                    scoreboardDisplay: 'HIDDEN',
                    cohort: game.cohort,
                    createdAt: game.publishedAt,
                    gameInfo: {
                        id: game.id,
                        headers: game.headers,
                    },
                    dojoPoints: 1,
                    reactions: {},
                }),
                TableName: timelineTable,
            }),
        );
    } catch (err) {
        console.error('Failed to create timeline entry: ', err);
    }
}
