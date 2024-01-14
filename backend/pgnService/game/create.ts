'use strict';

import axios from 'axios';
import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    APIGatewayProxyEventV2,
    APIGatewayProxyHandlerV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from '@jackstenglein/chess';

import { ApiError, errToApiGatewayProxyResultV2 } from './errors';
import { Game, GameOrientation } from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const usersTable = process.env.stage + '-users';
const gamesTable = process.env.stage + '-games';

enum GameImportType {
    LichessChapter = 'lichessChapter',
    LichessStudy = 'lichessStudy',
    Manual = 'manual',
}

interface GameImportHeaders {
    white: string;
    black: string;
    date: string;
}

interface CreateGameRequest {
    type: GameImportType;
    url?: string;
    pgnText?: string;
    headers?: GameImportHeaders[];
    orientation: GameOrientation;
}

function success(value: any): APIGatewayProxyResultV2 {
    console.log('Response: %j', value);
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
            pgnTexts = await getLichessChapter(request.url);
        } else if (request.type === GameImportType.LichessStudy) {
            pgnTexts = await getLichessStudy(request.url);
        } else if (request.type === GameImportType.Manual) {
            if (!request.pgnText) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage:
                        'Invalid request: pgnText is required when importing manual entry',
                });
            }
            pgnTexts = [request.pgnText];
        } else {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `Invalid request: type ${request.type} not supported`,
            });
        }
        console.log('PGN texts: ', pgnTexts);

        const [games, headers] = getGames(
            user,
            pgnTexts,
            request.headers,
            request.orientation
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
        })
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

function getUserInfo(event: any): { username: string; email: string } {
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
        request = JSON.parse(event.body || '');
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

async function getLichessChapter(url?: string): Promise<string[]> {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing from Lichess chapter',
        });
    }

    const response = await axios.get<string>(`${url}.pgn?source=true`);
    console.log('Get lichess chapter URL resp: %j', response);
    return [response.data];
}

async function getLichessStudy(url?: string): Promise<string[]> {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing from Lichess study',
        });
    }

    const response = await axios.get<string>(`${url}.pgn?source=true`);
    const games = response.data.split('\n\n\n[');
    return games
        .map((g, i) => {
            g = g.trim();
            if (!g) {
                return g;
            }
            if (i === 0) {
                return g;
            }
            return `[${g}`;
        })
        .filter((v) => v !== '');
}

function getGames(
    user: Record<string, any>,
    pgnTexts: string[],
    reqHeaders: GameImportHeaders[] | undefined,
    orientation: GameOrientation
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

function getGame(
    user: Record<string, any>,
    pgnText: string,
    headers: GameImportHeaders | undefined,
    orientation: GameOrientation
): [Game | null, GameImportHeaders] {
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

        chess.setHeader('White', chess.header().White?.trim() || '');
        chess.setHeader('Black', chess.header().Black?.trim() || '');
        chess.setHeader('Date', chess.header().Date?.replaceAll('-', '.') || '');

        if (
            !chess.header().White ||
            !chess.header().Black ||
            !isValidDate(chess.header().Date)
        ) {
            return [
                null,
                {
                    white: chess.header().White,
                    black: chess.header().Black,
                    date: chess.header().Date,
                },
            ];
        }

        if (!chess.header().PlyCount) {
            chess.setHeader('PlyCount', `${chess.plyCount()}`);
        }

        const now = new Date();
        const uploadDate = now.toISOString().slice(0, '2024-01-01'.length);

        return [
            {
                cohort: user.dojoCohort,
                id: `${uploadDate.replaceAll('-', '.')}_${uuidv4()}`,
                white: chess.header().White.toLowerCase(),
                black: chess.header().Black.toLowerCase(),
                date: chess.header().Date,
                createdAt: now.toISOString(),
                owner: user.username,
                ownerDisplayName: user.displayName,
                ownerPreviousCohort: user.previousCohort || '',
                headers: chess.header(),
                isFeatured: 'false',
                featuredAt: 'NOT_FEATURED',
                pgn: chess.renderPgn(),
                orientation,
                comments: [],
            },
            {
                white: chess.header().White,
                black: chess.header().Black,
                date: chess.header().Date,
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

function isValidDate(date?: string): boolean {
    if (!date) {
        return false;
    }
    if (!dateRegex.test(date)) {
        return false;
    }

    if (isNaN(Date.parse(date.replaceAll('.', '-')))) {
        return false;
    }

    const now = new Date();
    now.setDate(now.getDate() + 2);

    const d = new Date(date.replaceAll('.', '-'));
    if (d > now) {
        return false;
    }

    return true;
}

async function batchPutGames(games: Game[]): Promise<number> {
    const writeRequests = games.map((g) => {
        console.log('Marshalling game: %j', g);
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
            })
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
