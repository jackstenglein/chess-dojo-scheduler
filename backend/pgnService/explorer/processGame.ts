'use strict';

import {
    AttributeValue,
    ConditionalCheckFailedException,
    DeleteItemCommand,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import {
    ExplorerGame,
    ExplorerMove,
    ExplorerPosition,
    ExplorerResult,
    Game,
    GameResult,
} from './types';

const STARTING_POSITION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';
const knownPositions: Record<string, Set<string>> = {
    'masters-standard': new Set(),
    'masters-rapid': new Set(),
    'masters-blitz': new Set(),
    'masters-unknown': new Set(),
};

/** An ExplorerPosition extracted from a specific game. */
interface ExplorerPositionExtraction {
    /** The normalized FEN of the position. */
    normalizedFen: string;

    /** The result of the game from this position. */
    result: keyof ExplorerResult;

    /** The moves that continued from this position in the game. */
    moves: Record<string, ExplorerMoveExtraction>;
}

/** An ExplorerMove extracted from a specific game. */
interface ExplorerMoveExtraction {
    /** The SAN of the move. */
    san: string;

    /** The result of the move. */
    result: keyof ExplorerResult;
}

/** An update to an ExplorerPosition. */
interface ExplorerPositionUpdate {
    /** The normalized FEN of the position. */
    normalizedFen: string;

    /** The old result of the game from this position. */
    oldResult?: keyof ExplorerResult;

    /** The new result of the game from this position. */
    newResult?: keyof ExplorerResult;

    /** The moves to update on the FEN. */
    moves: ExplorerMoveUpdate[];
}

/** An update to an ExplorerMove. */
interface ExplorerMoveUpdate {
    san: string;

    /** The old result of the move. */
    oldResult?: keyof ExplorerResult;

    /** The new result of the move. */
    newResult?: keyof ExplorerResult;
}

/**
 * Extracts the positions from a list of Games and saves them to the explorer table.
 * @param event The DynamoDB stream event that triggered this Lambda. It contains the Game table objects.
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    const start = Date.now();
    const positionUpdates: Record<string, Record<string, ExplorerPositionUpdate[]>> = {};

    for (const record of event.Records) {
        await processRecord(record, positionUpdates);
    }

    const promises: Promise<boolean>[] = [];
    const fenUpdates = Object.values(positionUpdates);
    for (const fenUpdate of fenUpdates) {
        for (const [cohort, updates] of Object.entries(fenUpdate)) {
            promises.push(writePositionUpdates(cohort, updates));
        }
    }
    const results = await Promise.allSettled(promises);
    const end = Date.now();
    console.log(
        'INFO: Finished updating %d explorer positions with %d failures',
        results.length,
        results.reduce((sum, v) => {
            if (v.status === 'rejected') {
                return sum + 1;
            }
            return sum;
        }, 0),
    );
    console.log(`INFO: Execution Time: ${end - start} ms`);
};

/**
 * Extracts the positions from a single Game and saves or removes them as necessary.
 * @param record A single DynamoDB stream record to extract positions from.
 */
async function processRecord(
    record: DynamoDBRecord,
    positionUpdates: Record<string, Record<string, ExplorerPositionUpdate[]>>,
) {
    try {
        const oldGame = record.dynamodb?.OldImage
            ? (unmarshall(
                  record.dynamodb.OldImage as Record<string, AttributeValue>,
              ) as Game)
            : undefined;
        const newGame = record.dynamodb?.NewImage
            ? (unmarshall(
                  record.dynamodb.NewImage as Record<string, AttributeValue>,
              ) as Game)
            : undefined;

        const game = newGame || oldGame;
        if (!game) {
            console.log('Neither new game nor old game are present, skipping');
            return;
        }

        if (oldGame?.pgn === newGame?.pgn && oldGame?.unlisted === newGame?.unlisted) {
            console.log('Neither PGN nor unlisted was updated, skipping');
            return;
        }

        const oldExplorerPositions = extractPositions(oldGame);
        const newExplorerPositions = extractPositions(newGame);
        const updates = getUpdates(oldExplorerPositions, newExplorerPositions);

        console.log('Length of updates: ', updates.length);

        const promises: Promise<boolean>[] = [];
        for (const update of updates) {
            promises.push(updateExplorerGame(game, update));
        }
        const results = await Promise.allSettled(promises);
        console.log(
            'Finished updating %d explorer games with %d failures',
            results.length,
            results.reduce((sum, v) => {
                if (v.status === 'rejected') {
                    return sum + 1;
                }
                return sum;
            }, 0),
        );

        updates.forEach((update, i) => {
            if (results[i]) {
                if (!positionUpdates[update.normalizedFen]) {
                    positionUpdates[update.normalizedFen] = {};
                }
                if (!positionUpdates[update.normalizedFen][getExplorerCohort(newGame!)]) {
                    positionUpdates[update.normalizedFen][getExplorerCohort(newGame!)] =
                        [];
                }
                positionUpdates[update.normalizedFen][getExplorerCohort(newGame!)].push(
                    update,
                );
            }
        });
    } catch (err) {
        console.log('ERROR: Failed to process record %j: ', record, err);
    }
}

/**
 * Extracts all ExplorerPositionUpdates from the given PGN.
 * @param pgn The PGN to extract ExplorerPositionUpdates from.
 * @returns A map from normalized FEN to ExplorerPositionUpdate.
 */
function extractPositions(game?: Game): Record<string, ExplorerPositionExtraction> {
    if (game?.unlisted) {
        return {};
    }
    if (!game?.pgn) {
        return {};
    }

    const chess = new Chess({ pgn: game.pgn });
    if (chess.history().length === 0) {
        return {};
    }
    chess.seek(null);

    const explorerPositions: Record<string, ExplorerPositionExtraction> = {};
    extractPositionRecursive(chess, explorerPositions);
    return explorerPositions;
}

/**
 * Recursively extracts all ExplorerPositionUpdates from the given Chess object.
 * @param chess The Chess object to extract positions from.
 * @param explorerPositions A map from normalized FEN to ExplorerPositionUpdate where
 * the extracted updates will be saved.
 */
function extractPositionRecursive(
    chess: Chess,
    explorerPositions: Record<string, ExplorerPositionExtraction>,
) {
    const normalizedFen = chess.normalizedFen();
    const isMainline = chess.isInMainline();

    const explorerPosition: ExplorerPositionExtraction = explorerPositions[
        normalizedFen
    ] || {
        normalizedFen,
        result: isMainline
            ? getExplorerMoveResult(chess.header().tags.Result)
            : 'analysis',
        moves: {},
    };
    explorerPositions[normalizedFen] = explorerPosition;

    const nextMove = chess.nextMove();
    if (nextMove) {
        if (
            nextMove.san !== 'Z0' &&
            (isMainline || !explorerPosition.moves[nextMove.san])
        ) {
            explorerPosition.moves[nextMove.san] = {
                san: nextMove.san,
                result: isMainline
                    ? getExplorerMoveResult(chess.header().tags.Result)
                    : 'analysis',
            };
        }
        chess.seek(nextMove);
        extractPositionRecursive(chess, explorerPositions);

        for (const variation of nextMove.variations || []) {
            if (variation[0]) {
                if (
                    variation[0].san !== 'Z0' &&
                    !explorerPosition.moves[variation[0].san]
                ) {
                    explorerPosition.moves[variation[0].san] = {
                        san: variation[0].san,
                        result: 'analysis',
                    };
                }

                chess.seek(variation[0]);
                extractPositionRecursive(chess, explorerPositions);
            }
        }
    }
}

/**
 * Returns a list of ExplorerPositionUpdates necessary to get from the old
 * ExplorerPositionExtractions to the new ExplorerPositionExtractions.
 * @param oldPositions The ExplorerPositionExtractions before the update.
 * @param newPositions The ExplorerPositionExtractions after the update.
 * @returns A list of ExplorerPositionUpdates.
 */
function getUpdates(
    oldPositions: Record<string, ExplorerPositionExtraction>,
    newPositions: Record<string, ExplorerPositionExtraction>,
): ExplorerPositionUpdate[] {
    const updates: ExplorerPositionUpdate[] = [];

    // Handles updates and deletes of positions
    for (const [fen, oldPosition] of Object.entries(oldPositions)) {
        const newPosition = newPositions[fen];

        const moves: ExplorerMoveUpdate[] = [];

        // Handles updates and deletes of moves
        for (const [san, oldMove] of Object.entries(oldPosition.moves)) {
            const newMove = newPosition?.moves[san];

            moves.push({
                san,
                oldResult: oldMove.result,
                newResult: newMove?.result,
            });
        }

        // Handles new moves
        for (const [san, newMove] of Object.entries(newPosition?.moves || {})) {
            if (oldPosition.moves[san]) {
                continue;
            }

            moves.push({
                san,
                newResult: newMove.result,
            });
        }

        updates.push({
            normalizedFen: fen,
            oldResult: oldPosition.result,
            newResult: newPosition?.result,
            moves,
        });
    }

    // Handles new positions
    for (const [fen, newPosition] of Object.entries(newPositions)) {
        if (oldPositions[fen]) {
            continue;
        }

        updates.push({
            normalizedFen: fen,
            newResult: newPosition.result,
            moves: Object.values(newPosition.moves).map((m) => ({
                san: m.san,
                newResult: m.result,
            })),
        });
    }

    return updates;
}

/**
 * Converts a PGN result to an ExplorerMoveResult.
 * @param result The PGN result to convert.
 * @returns The ExplorerMoveResult matching the PGN result.
 */
function getExplorerMoveResult(result?: string): keyof ExplorerResult {
    switch (result) {
        case GameResult.White:
            return 'white';
        case GameResult.Black:
            return 'black';
        case GameResult.Draw:
            return 'draws';
    }
    return 'analysis';
}

async function writePositionUpdates(
    cohort: string,
    updates: ExplorerPositionUpdate[],
): Promise<boolean> {
    const fen = updates[0].normalizedFen;

    if (knownPositions[cohort].has(fen)) {
        return updateExplorerPositions(cohort, updates);
    }

    let result = false;
    const position = await fetchExplorerPosition(fen);
    if (!position) {
        result = await setOrUpdateExplorerPosition(cohort, updates);
    } else if (!position.results[cohort]) {
        const initialExplorerPosition = getInitialExplorerPosition(updates, cohort);
        result = await setExplorerPositionCohortBatch(cohort, initialExplorerPosition);
        if (!result) {
            result = await updateExplorerPositions(cohort, updates);
        }
    } else {
        knownPositions[cohort].add(fen);
        return updateExplorerPositions(cohort, updates);
    }

    if (result) {
        knownPositions[cohort].add(fen);
    }
    return result;
}

/**
 * Fetches the explorer position with the given FEN from the database.
 * If it does not exist, undefined is returned.
 * @param normalizedFen The normalized FEN to fetch.
 * @returns The explorer position with the normalized FEN.
 */
async function fetchExplorerPosition(
    normalizedFen: string,
): Promise<ExplorerPosition | undefined> {
    const input = new GetItemCommand({
        Key: {
            normalizedFen: {
                S: normalizedFen,
            },
            id: {
                S: 'POSITION',
            },
        },
        TableName: explorerTable,
    });

    const output = await dynamo.send(input);
    if (!output.Item) {
        return undefined;
    }

    return unmarshall(output.Item) as ExplorerPosition;
}

/**
 * Creates a blank ExplorerPosition with the provided update applied and conditionally saves it.
 * If the ExplorerPosition already exists, it falls back to updating the ExplorerPosition.
 * @param game The game that generated the ExplorerPosition.
 * @param chess The Chess.ts instance to use when generating initial ExplorerPosition moves.
 * @param update The update to apply to the ExplorerPosition.
 * @returns True if the ExplorerPosition was successfully saved.
 */
async function setOrUpdateExplorerPosition(
    cohort: string,
    updates: ExplorerPositionUpdate[],
): Promise<boolean> {
    const initialExplorerPosition = getInitialExplorerPosition(updates, cohort);
    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(initialExplorerPosition),
                ConditionExpression: 'attribute_not_exists(normalizedFen)',
                TableName: explorerTable,
            }),
        );
        return true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            // This should be rare, as it only happens when two games with the same
            // new position are added simultaneously
            const result = await setExplorerPositionCohortBatch(
                cohort,
                initialExplorerPosition,
            );
            if (result) {
                return true;
            }
            return updateExplorerPositions(cohort, updates);
        }
        throw new Error(
            `ERROR: Failed to set initial explorer position ${initialExplorerPosition}:\r\r${err}`,
        );
    }
}

/**
 * Gets the cohort, as used in the explorer database, of the game.
 * For most games, this will just be the game's cohort. However, for
 * games in the masters DB, it is the value `masters-<timeClass>`, where
 * <timeClass> is either standard, rapid, blitz or unknown.
 * @param game The game to get the explorer cohort for.
 * @returns The explorer cohort of the game.
 */
function getExplorerCohort(game: Game): string {
    if (game.cohort !== 'masters') {
        return game.cohort;
    }
    if (!game.timeClass) {
        return 'masters-unknown';
    }
    return `masters-${game.timeClass.toLowerCase()}`;
}

/**
 * Returns an ExplorerPosition object initialized with the data in the updates.
 * @param chess A Chess.ts instance to use when generating the list of legal moves in the position.
 * @param updates The ExplorerPositionUpdate to apply to a blank ExplorerPosition.
 * @param cohort The cohort the update applies to.
 * @returns An ExplorerPosition object initialized with the given update data.
 */
function getInitialExplorerPosition(
    updates: ExplorerPositionUpdate[],
    cohort: string,
): ExplorerPosition {
    const chess = new Chess({ fen: updates[0].normalizedFen });
    const moves = chess.moves({ disableNullMoves: true });

    const explorerMoves = moves.reduce(
        (map, move) => {
            map[move.san] = {
                san: move.san,
                results: {
                    [cohort]: {},
                },
            };
            return map;
        },
        {} as Record<string, ExplorerMove>,
    );

    const explorerPosition: ExplorerPosition = {
        normalizedFen: updates[0].normalizedFen,
        id: 'POSITION',
        results: {
            [cohort]: {},
        },
        moves: explorerMoves,
    };

    for (const update of updates) {
        explorerPosition.results[cohort][update.newResult!] =
            (explorerPosition.results[cohort][update.newResult!] ?? 0) + 1;

        update.moves.forEach((move) => {
            explorerPosition.moves[move.san].results[cohort][move.newResult!] =
                (explorerPosition.moves[move.san].results[cohort][move.newResult!] ?? 0) +
                1;
        });
    }

    return explorerPosition;
}

async function updateExplorerPositions(
    cohort: string,
    updates: ExplorerPositionUpdate[],
): Promise<boolean> {
    let updateExpression = `ADD `;

    const expressionAttrValues: Record<string, AttributeValue> = {};
    const expressionAttrNames: Record<string, string> = {
        '#cohort': cohort,
    };

    const resultUpdates: ExplorerResult = {};
    const moveUpdates: Record<string, ExplorerResult> = {};
    for (const update of updates) {
        resultUpdates[update.newResult!] = (resultUpdates[update.newResult!] ?? 0) + 1;

        update.moves.forEach((move) => {
            const sanitizedSan = sanitizeSan(move.san);
            if (!moveUpdates[sanitizedSan]) {
                moveUpdates[sanitizedSan] = {};
            }
            moveUpdates[sanitizedSan][move.newResult!] =
                (moveUpdates[sanitizedSan][move.newResult!] ?? 0) + 1;

            expressionAttrNames[`#${sanitizedSan}`] = move.san;
        });
    }

    for (const [key, value] of Object.entries(resultUpdates)) {
        updateExpression += `results.#cohort.${key} :${key}, `;
        expressionAttrValues[`:${key}`] = { N: `${value}` };
    }

    for (const [sanitizedSan, result] of Object.entries(moveUpdates)) {
        for (const [resultName, value] of Object.entries(result)) {
            if (value) {
                updateExpression += `moves.#${sanitizedSan}.results.#cohort.${resultName} :${sanitizedSan}${resultName}, `;
                expressionAttrValues[`:${sanitizedSan}${resultName}`] = { N: `${value}` };
            }
        }
    }

    updateExpression = updateExpression.substring(
        0,
        updateExpression.length - ', '.length,
    );

    const input = new UpdateItemCommand({
        Key: {
            normalizedFen: {
                S: updates[0].normalizedFen,
            },
            id: {
                S: 'POSITION',
            },
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttrNames,
        ExpressionAttributeValues: expressionAttrValues,
        TableName: explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        return true;
    } catch (err) {
        console.log(
            'ERROR: Failed to apply updates %j with input %j: ',
            updates,
            input,
            err,
        );
        throw err;
    }
}

function sanitizeSan(san: string): string {
    return san.replace(/[\+\#=-]/g, '');
}

/**
 * Updates the given explorer position so that the given cohort is first initialized in the explorer position.
 * If the explorer position already has the given cohort, then the update fails. The function returns true
 * if the update is successful.
 * @param cohort The cohort to initialize.
 * @param update The update to apply.
 * @param position The current ExplorerPosition in the database.
 * @returns True if the update is successful.
 */
async function setExplorerPositionCohort(
    cohort: string,
    update: ExplorerPositionUpdate,
    position: ExplorerPosition | undefined,
): Promise<boolean> {
    if (position?.results[cohort] || update.oldResult || !update.newResult) {
        return false;
    }

    let updateExpression = `SET results.#cohort = :result, `;
    const exprAttrValues: Record<string, AttributeValue> = {
        ':result': {
            M: {
                [update.newResult]: { N: '1' },
            },
        },
    };
    const exprAttrNames: Record<string, string> = {
        '#cohort': cohort,
    };

    const chess = new Chess({ fen: update.normalizedFen });
    const moves = chess.moves({ disableNullMoves: true });

    const resultPerMove: Record<string, keyof ExplorerResult | undefined> = {};
    update.moves.forEach((move) => (resultPerMove[move.san] = move.newResult));

    moves.forEach((move, index) => {
        updateExpression += `moves.#san${index}.results.#cohort = :result${index}, `;
        exprAttrNames[`#san${index}`] = move.san;
        const result = resultPerMove[move.san];
        exprAttrValues[`:result${index}`] = {
            M: result
                ? {
                      [result]: { N: '1' },
                  }
                : {},
        };
    });

    updateExpression = updateExpression.substring(
        0,
        updateExpression.length - ', '.length,
    );

    const input = new UpdateItemCommand({
        Key: {
            normalizedFen: {
                S: update.normalizedFen,
            },
            id: {
                S: 'POSITION',
            },
        },
        UpdateExpression: updateExpression,
        ConditionExpression: 'attribute_not_exists(results.#cohort)',
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        TableName: explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        return true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            // This happens only when two people in the same cohort simultaneously
            // upload a game with a move not played before in that cohort
            console.log('setExplorerPositionCohort conditional check failed');
            return false;
        }
        console.log('Failed setExplorerPositionCohort: ', err);
        throw err;
    }
}

async function setExplorerPositionCohortBatch(
    cohort: string,
    initialPosition: ExplorerPosition,
): Promise<boolean> {
    let updateExpression = 'SET results.#cohort = :result, ';

    const exprAttrNames: Record<string, string> = {
        '#cohort': cohort,
    };
    const exprAttrValues: Record<string, AttributeValue> = {
        ':result': {
            M: marshall(initialPosition.results[cohort], { removeUndefinedValues: true }),
        },
    };

    Object.values(initialPosition.moves).forEach((move, index) => {
        updateExpression += `moves.#san${index}.results.#cohort = :result${index}, `;
        exprAttrNames[`#san${index}`] = move.san;
        exprAttrValues[`:result${index}`] = {
            M: marshall(move.results[cohort], { removeUndefinedValues: true }),
        };
    });

    updateExpression = updateExpression.substring(
        0,
        updateExpression.length - ', '.length,
    );

    const input = new UpdateItemCommand({
        Key: {
            normalizedFen: {
                S: initialPosition.normalizedFen,
            },
            id: {
                S: 'POSITION',
            },
        },
        UpdateExpression: updateExpression,
        ConditionExpression: 'attribute_not_exists(results.#cohort)',
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        TableName: explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        return true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            // This happens only when two people in the same cohort simultaneously
            // upload a game with a move not played before in that cohort
            console.log('setExplorerPositionCohort conditional check failed');
            return false;
        }
        console.log('Failed setExplorerPositionCohort with input %j: ', input, err);
        throw err;
    }
}

/**
 * Sets or removes the ExplorerGame associated with this game and update as necessary.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 * @returns
 */
async function updateExplorerGame(
    game: Game,
    update: ExplorerPositionUpdate,
): Promise<boolean> {
    if (update.oldResult && !update.newResult) {
        // The position or game was deleted
        return removeExplorerGame(game, update);
    } else {
        // The position or game is new or modified
        return putExplorerGame(game, update);
    }
}

/**
 * Sets the ExplorerGame in the database associated with this game and update. If the position
 * is the starting position, then the update is skipped.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function putExplorerGame(
    game: Game,
    update: ExplorerPositionUpdate,
): Promise<boolean> {
    if (update.normalizedFen === STARTING_POSITION_FEN) {
        return true;
    }

    const id = `GAME#${getExplorerCohort(game)}#${game.id}`;
    const explorerGame: ExplorerGame = {
        normalizedFen: update.normalizedFen,
        id,
        cohort: game.cohort,
        owner: game.owner,
        result: update.newResult!,
        game: {
            cohort: game.cohort,
            id: game.id,
            date: game.date,
            createdAt: game.createdAt,
            publishedAt: game.publishedAt,
            owner: game.owner,
            ownerDisplayName: game.ownerDisplayName,
            timeClass: game.timeClass,
            headers: {
                White: game.headers.White,
                WhiteElo: game.headers.WhiteElo,
                Black: game.headers.Black,
                BlackElo: game.headers.BlackElo,
                Result: game.headers.Result,
                PlyCount: game.headers.PlyCount,
            },
        },
    };

    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(explorerGame, { removeUndefinedValues: true }),
                TableName: explorerTable,
            }),
        );
        return true;
    } catch (err) {
        console.log('ERROR: Failed to set explorer game %j: ', explorerGame, err);
        return false;
    }
}

/**
 * Removes the ExplorerGame in the database associated with this game and update. If the
 * position is the starting position, then the update is skipped.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function removeExplorerGame(
    game: Game,
    update: ExplorerPositionUpdate,
): Promise<boolean> {
    if (update.normalizedFen === STARTING_POSITION_FEN) {
        return true;
    }

    try {
        const id = `GAME#${getExplorerCohort(game)}#${game.id}`;
        await dynamo.send(
            new DeleteItemCommand({
                Key: {
                    normalizedFen: { S: update.normalizedFen },
                    id: { S: id },
                },
                TableName: explorerTable,
            }),
        );
        return true;
    } catch (err) {
        console.log('ERROR: Failed to delete explorer game: ', err);
        return false;
    }
}
