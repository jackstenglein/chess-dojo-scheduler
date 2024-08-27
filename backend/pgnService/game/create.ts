'use strict';

import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { User } from '@jackstenglein/chess-dojo-common/src/database/user';
import {
    clockToSeconds,
    secondsToClock,
} from '@jackstenglein/chess-dojo-common/src/pgn/clock';
import {
    APIGatewayProxyEventV2,
    APIGatewayProxyHandlerV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda';
import { addDirectoryItems } from 'chess-dojo-directory-service/addItem';
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

        const pgnTexts = await getPgnTexts(request);
        console.log('PGN texts length: ', pgnTexts.length);

        const games = getGames(user, pgnTexts);
        if (games.length === 0) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Invalid request: no games found',
            });
        }

        const updated = await batchPutGames(games);

        if (request.directory) {
            await addGamesToDirectory(request.directory, games);
        }

        if (games.length === 1) {
            return success(games[0]);
        }
        return success({ count: updated });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function getUser(event: APIGatewayProxyEventV2): Promise<User> {
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

    return unmarshall(getItemOutput.Item) as User;
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

/**
 * Returns a list of PGN texts for the given request.
 * @param request The request to get the PGN texts for.
 * @returns A list of PGN texts.
 */
export async function getPgnTexts(request: CreateGameRequest): Promise<string[]> {
    switch (request.type) {
        case GameImportType.LichessChapter:
            return [await getLichessChapter(request.url)];
        case GameImportType.LichessGame:
            return request.pgnText
                ? [request.pgnText]
                : [await getLichessGame(request.url)];
        case GameImportType.LichessStudy:
            return await getLichessStudy(request.url);
        case GameImportType.ChesscomGame:
            return request.pgnText
                ? [request.pgnText]
                : [await getChesscomGame(request.url)];
        case GameImportType.ChesscomAnalysis:
            return [await getChesscomAnalysis(request.url)];

        case GameImportType.Manual:
        case GameImportType.StartingPosition:
        case GameImportType.Fen:
            if (request.pgnText === undefined) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage:
                        'Invalid request: pgnText is required for this import method',
                });
            }
            return [cleanupChessbasePgn(request.pgnText)];
    }

    throw new ApiError({
        statusCode: 400,
        publicMessage: `Invalid request: type ${request.type} not supported`,
    });
}

/**
 * Cleans up a PGN to remove Chessbase-specific issues. If the PGN is from
 * Chessbase (determined by the presence of the %evp command), then we apply
 * two transformations to the PGN. First, all newlines in the PGN are converted
 * to the space character to revert Chessbase PGN line wrapping. After this
 * conversion, any double spaces are converted to a newline to re-introduce
 * newlines added by the user in a comment. Second, if the clock times are
 * present in %emt format, they are converted to %clk format.
 * @param pgn The PGN to potentially clean up.
 * @returns The cleaned PGN if it is from Chessbase, or the PGN unchanged if not.
 */
function cleanupChessbasePgn(pgn: string): string {
    const startIndex = pgn.indexOf('{[%evp');
    if (startIndex < 0) {
        return pgn;
    }
    return convertEmt(
        pgn.substring(0, startIndex) +
            pgn.substring(startIndex).replaceAll('\n', ' ').replaceAll('  ', '\n'),
    );
}

/**
 * Converts %emt commands to %clk commands in the PGN using the following
 * algorithm:
 *   1. If the TimeControl header is not present in the PGN, then %emt is
 *      converted to %clk using raw string replacement.
 *   2. Otherwise, go through each move and use the %emt value to calculate
 *      the player's remaining clock time after the move. Set %clk to that
 *      value.
 *   3. If at any point during step 2 a player has a negative clock time,
 *      assume that Chessbase incorrectly used %emt and fallback to using
 *      raw string replacement.
 * @param pgn The PGN to convert.
 * @returns The converted PGN.
 */
function convertEmt(pgn: string): string {
    const chess = new Chess({ pgn });
    const timeControls = chess.header().tags.TimeControl?.items;

    if (!timeControls || timeControls.length === 0) {
        return pgn.replaceAll('[%emt', '[%clk');
    }

    let timeControlIdx = 0;
    let evenPlayerClock = timeControls[0].seconds || 0;
    let oddPlayerClock = timeControls[0].seconds || 0;

    for (let i = 0; i < chess.history().length; i++) {
        const move = chess.history()[i];
        const timeControl = timeControls[timeControlIdx];

        let timeUsed = clockToSeconds(move.commentDiag?.emt) ?? 0;
        if ((i === 0 || i === 1) && timeUsed === 60) {
            // Chessbase has a weird bug where it will say the players used 1 min on the first
            // move even if they actually used no time
            timeUsed = 0;
        }

        let newTime: number;
        let additionalTime = 0;

        if (
            timeControl.moves &&
            timeControlIdx + 1 < timeControls.length &&
            i / 2 === timeControl.moves - 1
        ) {
            additionalTime = Math.max(0, timeControls[timeControlIdx + 1].seconds ?? 0);
            if (move.color === 'b') {
                timeControlIdx++;
            }
        }

        if (i % 2) {
            oddPlayerClock =
                oddPlayerClock -
                timeUsed +
                Math.max(0, timeControl.increment ?? timeControl.delay ?? 0) +
                additionalTime;
            newTime = oddPlayerClock;
        } else {
            evenPlayerClock =
                evenPlayerClock -
                timeUsed +
                Math.max(0, timeControl.increment ?? timeControl.delay ?? 0) +
                additionalTime;
            newTime = evenPlayerClock;
        }

        if (newTime < 0) {
            return pgn.replaceAll('[%emt', '[%clk');
        }

        chess.setCommand('emt', '', move);
        chess.setCommand('clk', secondsToClock(newTime), move);
    }

    return chess.renderPgn();
}

function getGames(user: User, pgnTexts: string[]): Game[] {
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
        !/^\[Variant\s+['"]?Standard['"]?\s*\]$/gim.test(pgnText) &&
        !/^\[Variant\s+['"]?From Position['"]?\s*\]$/gim.test(pgnText)
    );
}

export function getGame(
    user: User | undefined,
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

        chess.setHeader('White', chess.header().tags.White?.trim() || '?');
        chess.setHeader('Black', chess.header().tags.Black?.trim() || '??');
        chess.setHeader('Result', chess.header().tags.Result?.trim() || '*');
        chess.setHeader('PlyCount', `${chess.plyCount()}`);

        if (!isValidDate(chess.header().tags.Date?.value)) {
            chess.setHeader('Date', '');
        }
        if (!isValidResult(chess.header().tags.Result)) {
            chess.setHeader('Result', '*');
        }

        const now = new Date();
        const uploadDate = now.toISOString().slice(0, '2024-01-01'.length);

        return {
            cohort: user?.dojoCohort || '',
            id: `${uploadDate.replaceAll('-', '.')}_${uuidv4()}`,
            white: chess.header().tags.White?.toLowerCase() || '?',
            black: chess.header().tags.Black?.toLowerCase() || '?',
            date: chess.header().tags.Date?.value || '',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            owner: user?.username || '',
            ownerDisplayName: user?.displayName || '',
            ownerPreviousCohort: user?.previousCohort || '',
            headers: chess.header().valueMap(),
            pgn: chess.renderPgn(),
            orientation: getDefaultOrientation(chess, user),
            comments: [],
            positionComments: {},
            unlisted: true,
        };
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid PGN',
            privateMessage: 'Failed to get game',
            cause: err,
        });
    }
}

/**
 * Gets the default orientation for the given chess instance and user. If any of
 * the user's usernames match the White/Black header in the chess instance, that
 * color is returned. If not, white is used as the default orientation.
 * @param chess The chess instance to get the default orientation for.
 * @param user The user to get the default orientation for.
 * @returns The default orientation of the game.
 */
function getDefaultOrientation(chess: Chess, user?: User): GameOrientation {
    if (!user) {
        return GameOrientation.White;
    }

    for (const rating of Object.values(user.ratings)) {
        if (rating.username?.toLowerCase() === chess.header().tags.White?.toLowerCase()) {
            return GameOrientation.White;
        }
        if (rating.username?.toLowerCase() === chess.header().tags.Black?.toLowerCase()) {
            return GameOrientation.Black;
        }
    }

    if (user?.displayName.toLowerCase() === chess.header().tags.Black?.toLowerCase()) {
        return GameOrientation.Black;
    }

    return GameOrientation.White;
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

/**
 * Adds the given games to the given directory.
 * @param directoryId The id of the directory. Must be owned by the owner of the games.
 * @param games The games to add. Must all have the same owner.
 */
async function addGamesToDirectory(directoryId: string, games: Game[]) {
    try {
        console.log('Adding %d games to directory %s', games.length, directoryId);
        const directoryItems: DirectoryItem[] = games.map((g) => ({
            type: DirectoryItemTypes.OWNED_GAME,
            id: `${g.cohort}#${g.id}`,
            metadata: {
                cohort: g.cohort,
                id: g.id,
                owner: g.owner,
                ownerDisplayName: g.ownerDisplayName || '',
                createdAt: g.createdAt,
                white: g.headers.White,
                black: g.headers.Black,
                whiteElo: g.headers.WhiteElo,
                blackElo: g.headers.BlackElo,
                result: g.headers.Result,
            },
        }));

        await addDirectoryItems(games[0].owner, directoryId, directoryItems);
    } catch (err) {
        console.error('Failed to add games to directory: ', err);
    }
}
