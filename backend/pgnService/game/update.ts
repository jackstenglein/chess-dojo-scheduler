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
import {
    dynamo,
    gamesTable,
    getGame,
    getPgnTexts,
    getUserInfo,
    success,
    timelineTable,
} from './create';
import { ApiError, errToApiGatewayProxyResultV2 } from './errors';
import {
    Game,
    GameImportHeaders,
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
    const update = await getGameUpdate(request);

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
        const request: Partial<UpdateGameRequest> = JSON.parse(event.body || '{}');
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
                publicMessage: `Invalid request: orientation must be "${GameOrientation.White}" or "${GameOrientation.Black}" if provided`,
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
async function getGameUpdate(request: UpdateGameRequest): Promise<GameUpdate> {
    const update: GameUpdate = {
        updatedAt: new Date().toISOString(),
    };

    if (request.unlisted !== undefined) {
        update.unlisted = request.unlisted;

        if (request.unlisted) {
            update.publishedAt = null;
            update.timelineId = '';
        } else {
            update.publishedAt = new Date().toISOString();
            update.timelineId = `${update.publishedAt?.split('T')[0]}_${uuidv4()}`;
        }
    }

    if (request.orientation) {
        update.orientation = request.orientation;
    }

    if (request.type) {
        const pgnText = (await getPgnTexts(request))[0];
        const game = getGame(undefined, pgnText, request.headers);

        update.white = game.white;
        update.black = game.black;
        update.date = game.date;
        update.pgn = game.pgn;
        update.headers = game.headers;

        const result = game.headers['Result'];
        if (
            isMissingData({ ...update, result }) &&
            update.unlisted !== undefined &&
            !update.unlisted
        ) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Published games can not be missing data',
                privateMessage: 'update requested, but game was missing data',
            });
        }
    }

    return update;
}

/**
 * Strip pgn player name tag values (i.e. the tags White and Black). As a convention, chess.com and others
 * use question marks as placeholders for unknown values in PGN tags. In places, we have
 * adopted this convention. Therefore, in order to tell if a name is truly empty, handling the case
 * where the name value may be a placeholder, we must account for this convention.
 * @param value the name to strip
 * @returns the stripped name
 */
function stripPlayerNameHeader(value?: string): string {
    return value?.trim().replaceAll('?', '') ?? '';
}

/**
 * Returns whether the game headers are missing data needed to publish
 * @param game The game to check for publishability
 * @returns Whether or not the game update is missing data
 */
function isMissingData({
    white,
    black,
    result,
    date,
}: Partial<GameImportHeaders>): boolean {
    const strippedWhite = stripPlayerNameHeader(white);
    const strippedBlack = stripPlayerNameHeader(black);

    return (
        !strippedWhite ||
        !strippedBlack ||
        !isValidDate(date) ||
        !isPublishableResult(result)
    );
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
