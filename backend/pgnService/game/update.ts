'use strict';

import {
    ConditionalCheckFailedException,
    DeleteItemCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    APIGatewayProxyEventV2,
    APIGatewayProxyHandlerV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getChesscomAnalysis, getChesscomGame } from './chesscom';
import {
    cleanupChessbasePgn,
    dynamo,
    gamesTable,
    getGame,
    getUserInfo,
    success,
    timelineTable,
} from './create';
import { ApiError, errToApiGatewayProxyResultV2 } from './errors';
import { getLichessChapter, getLichessGame } from './lichess';
import {
    Game,
    GameImportHeaders,
    GameImportType,
    GameOrientation,
    GameUpdate,
    UpdateGameRequest,
    isPublishableResult,
    isValidDate,
} from './types';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        return await updateGame(event);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function updateGame(
    event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
    const userInfo = getUserInfo(event);
    if (!userInfo.username) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: username is required',
        });
    }

    const request = getRequest(event);
    const [update, headers] = await getGameUpdate(request);
    if (headers) {
        return success({ count: 1, headers: [headers] });
    }
    if (!update) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: 'Update is null but headers was not null',
        });
    }

    const game = await applyUpdate(userInfo.username, request.cohort, request.id, update);
    if (update.timelineId) {
        await createTimelineEntry(game);
    } else if (update.unlisted && request.timelineId) {
        await deleteTimelineEntry(game, request.timelineId);
    }

    return success(game);
}

/**
 * Parses an API Gateway event and returns the corresponding UpdateGameRequest.
 * @param event The API Gateway event to parse.
 * @returns An UpdateGameRequest.
 */
function getRequest(event: APIGatewayProxyEventV2): UpdateGameRequest {
    const cohort = event.pathParameters?.cohort;
    if (!cohort) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: cohort is required',
        });
    }

    const encodedId = event.pathParameters?.id;
    if (!encodedId) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: id is required',
        });
    }
    const id = atob(encodedId);

    try {
        const request: UpdateGameRequest = JSON.parse(event.body || '{}');
        if (!request.type && !request.orientation) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: at least one of type or orientation is required',
            });
        }
        if (
            request.orientation &&
            request.orientation !== GameOrientation.White &&
            request.orientation !== GameOrientation.Black
        ) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    `Invalid request: orientation must be "${GameOrientation.White}" or "${GameOrientation.Black}" if provided`,
            });
        }

        return {
            ...request,
            cohort,
            id,
        };
    } catch (err) {
        console.error('Failed to unmarshal body: ', err);
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: body could not be unmarshaled',
            cause: err,
        });
    }
}

/**
 * Returns a GameUpdate based on the given request.
 * @param request The UpdateGameRequest to process.
 * @returns A GameUpdate based on the given request.
 */
async function getGameUpdate(
    request: UpdateGameRequest,
): Promise<[GameUpdate | null, GameImportHeaders | null]> {
    const update: GameUpdate = {
        updatedAt: new Date().toISOString(),
    };

    if (request.orientation) {
        update.orientation = request.orientation;
    }
    if (request.unlisted !== undefined) {
        update.unlisted = request.unlisted;
        update.publishedAt = request.unlisted ? null : new Date().toISOString();
        update.timelineId = request.unlisted
            ? ''
            : `${update.publishedAt?.split('T')[0]}_${uuidv4()}`;
    }

    if (request.type) {
        let pgnText = '';
        if (request.type === GameImportType.LichessChapter) {
            pgnText = await getLichessChapter(request.url);
        } else if (request.type === GameImportType.LichessGame) {
            pgnText = await getLichessGame(request.url);
        } else if (request.type === GameImportType.ChesscomGame) {
            pgnText = await getChesscomGame(request.url);
        } else if (request.type === GameImportType.ChesscomAnalysis) {
            pgnText = await getChesscomAnalysis(request.url);
        } else if (request.type === GameImportType.Manual) {
            if (!request.pgnText) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage:
                        'Invalid request: PGN is required when using manual import type',
                });
            }
            pgnText = cleanupChessbasePgn(request.pgnText);
        } else {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `Invalid request: type '${request.type}' not supported`,
            });
        }

        const game = getGame(undefined, pgnText, request.headers);
        const headers = getImportHeaders(game);
        if (!request.unlisted && headers) {
            return [null, headers];
        }

        update.white = game.white;
        update.black = game.black;
        update.date = game.date;
        update.headers = game.headers;
        update.pgn = game.pgn;
    }

    return [update, null];
}

/**
 * Returns the import headers for the Game, if it is missing data. Otherwise returns null.
 * @param game The game to get the import headers for.
 * @returns The import headers, if the game is missing data. Null otherwise.
 */
function getImportHeaders(game: Game): GameImportHeaders | null {
    const strippedWhite = game.white.trim().replaceAll('?', '');
    const strippedBlack = game.black.trim().replaceAll('?', '');

    if (!strippedWhite || !strippedBlack || !isValidDate(game.date) || !isPublishableResult(game.headers.Result)) {
        return {
            white: strippedWhite ? game.white : '',
            black: strippedBlack ? game.black : '',
            date: isValidDate(game.date) ? game.date : '',
            result: isPublishableResult(game.headers.Result) ? game.headers.Result : ''
        }
    }
    return null;
}

/**
 * Saves the provided GameUpdate in the database.
 * @param owner The user making the update request.
 * @param cohort The cohort the Game is in.
 * @param id The id of the Game.
 * @param update The update to apply.
 * @returns The updated Game.
 */
async function applyUpdate(
    owner: string,
    cohort: string,
    id: string,
    update: GameUpdate,
): Promise<Game> {
    const updateParams = getUpdateParams(update);
    updateParams.ExpressionAttributeNames['#owner'] = 'owner';
    updateParams.ExpressionAttributeValues[':owner'] = { S: owner };

    const input = new UpdateItemCommand({
        ConditionExpression: 'attribute_exists(id) AND #owner = :owner',
        Key: {
            cohort: { S: cohort },
            id: { S: id },
        },
        TableName: gamesTable,
        ...updateParams,
        ReturnValues: 'ALL_NEW',
    });

    try {
        const response = await dynamo.send(input);
        if (response.Attributes) {
            return unmarshall(response.Attributes) as Game;
        } else {
            throw new ApiError({
                statusCode: 500,
                publicMessage: 'Temporary server error',
                privateMessage: 'DDB update completed but returned no attributes',
            });
        }
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: game not found or you do not have permission to update it',
                privateMessage: 'DDB conditional check failed',
                cause: err,
            });
        }
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: 'DDB UpdateItem failure',
            cause: err,
        });
    }
}

function getUpdateParams(params: { [key: string]: any }) {
    return {
        UpdateExpression: `set ${Object.entries(params)
            .map(([key]) => `#${key} = :${key}, `)
            .reduce((acc, str) => acc + str)
            .slice(0, -2)}`,
        ExpressionAttributeNames: Object.keys(params).reduce(
            (acc, key) => ({ ...acc, [`#${key}`]: key }),
            {} as Record<string, string>,
        ),
        ExpressionAttributeValues: marshall(
            Object.entries(params).reduce(
                (acc, [key, value]) => ({ ...acc, [`:${key}`]: value }),
                {},
            ),
            { removeUndefinedValues: true },
        ),
    };
}

/**
 * Creates a timeline entry for the given Game.
 * @param game The game to create the timeline entry for.
 */
async function createTimelineEntry(game: Game) {
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

/**
 * Deletes the timeline entry associated with the given Game.
 * @param game The Game to delete the timeline entry for.
 * @param id The id of the timeline entry.
 */
async function deleteTimelineEntry(game: Game, id: string) {
    try {
        await dynamo.send(
            new DeleteItemCommand({
                Key: {
                    owner: { S: game.owner },
                    id: { S: id },
                },
                TableName: timelineTable,
            }),
        );
    } catch (err) {
        console.error('Failed to delete timeline entry: ', err);
    }
}
