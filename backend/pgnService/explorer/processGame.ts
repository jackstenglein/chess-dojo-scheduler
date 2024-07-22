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
import deepEqual from 'deep-equal';
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
const mastersTable =
    process.env.stage === 'dev' ? 'dev-explorer' : 'prod-masters-explorer';

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

interface KnownPositionsCache {
    masters: Map<string, ExplorerPosition>;
    dojo: Map<string, ExplorerPosition>;
}

const knownPositions: KnownPositionsCache = {
    masters: new Map<string, ExplorerPosition>(),
    dojo: new Map<string, ExplorerPosition>(),
};

/**
 * Extracts the positions from a list of Games and saves them to the explorer table.
 * @param event The DynamoDB stream event that triggered this Lambda. It contains the Game table objects.
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    console.log(
        'Size of known positions cache at start: ',
        knownPositions.masters.size,
        knownPositions.dojo.size,
    );

    const positionUpdates = new Map<string, ExplorerPosition>();

    for (const record of event.Records) {
        await processRecord(record, positionUpdates, knownPositions);
    }

    console.log(
        `Applying ${positionUpdates.size} positions updates for ${event.Records.length} records`,
    );
    await applyBatchUpdates(positionUpdates);
};

/**
 * Extracts the positions from a single Game and saves or removes them as necessary.
 * @param record A single DynamoDB stream record to extract positions from.
 * @param positionUpdates The cache of position updates across all records in the stream's batch.
 * @param knownPositions The cache of known explorer positions in the database.
 */
async function processRecord(
    record: DynamoDBRecord,
    positionUpdates: Map<string, ExplorerPosition>,
    knownPositions: KnownPositionsCache,
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

        const promises: Promise<boolean>[] = [];
        for (const update of Object.values(updates)) {
            promises.push(
                writeExplorerPosition(game, update, positionUpdates, knownPositions),
            );
        }
        await Promise.all(promises);
        console.log(
            `Successfully applied ${updates.length} updates for game ${game.cohort}/${game.id}`,
        );
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
        if (deepEqual(oldPosition, newPosition)) {
            continue;
        }

        const moves: ExplorerMoveUpdate[] = [];

        // Handles updates and deletes of moves
        for (const [san, oldMove] of Object.entries(oldPosition.moves)) {
            const newMove = newPosition?.moves[san];
            if (deepEqual(oldMove, newMove)) {
                continue;
            }

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

/**
 * Writes the provided ExplorerPositionUpdate to DynamoDB, ensuring that an existing ExplorerPosition
 * for the same FEN is not overwritten. If this is a new ExplorerPosition, then it is created in a
 * way that allows for future updates.
 * @param game The game that generated the ExplorerPosition.
 * @param update The update to apply to the ExplorerPosition.
 * @param positionUpdates The cache of position updates across all records in the stream's batch.
 * @param knownPositions The cache of known explorer positions in the database.
 */
async function writeExplorerPosition(
    game: Game,
    update: ExplorerPositionUpdate,
    positionUpdates: Map<string, ExplorerPosition>,
    knownPositions: KnownPositionsCache,
): Promise<boolean> {
    if (!update.newResult && !update.oldResult) {
        throw new Error('ERROR: update does not contain newResult nor oldResult');
    }

    let success = false;
    const cohort = getExplorerCohort(game);

    const position = await fetchExplorerPosition(
        cohort,
        update.normalizedFen,
        knownPositions,
    );
    if (!position) {
        success = await setOrUpdateExplorerPosition(game, update);
    } else if (!position.results[cohort]) {
        success = await updateExplorerPosition(cohort, update, position);
    } else {
        mergeUpdate(positionUpdates, update, cohort);
        success = true;
    }

    if (success) {
        await updateExplorerGame(game, update);
    }
    return success;
}

/**
 * Fetches the explorer position with the given FEN from the database.
 * If it does not exist, undefined is returned. If the position is already
 * in the knownPositions cache, it is returned unchanged without fetching
 * from the database.
 * @param cohort The cohort that needs to be fetched.
 * @param normalizedFen The normalized FEN to fetch.
 * @param knownPositions The cache of known explorer positions in the database.
 * @returns The explorer position with the normalized FEN.
 */
async function fetchExplorerPosition(
    cohort: string,
    normalizedFen: string,
    knownPositions: KnownPositionsCache,
): Promise<ExplorerPosition | undefined> {
    const isMastersTable = cohort.startsWith('masters');
    const cache = isMastersTable ? knownPositions.masters : knownPositions.dojo;

    if (cache.has(normalizedFen)) {
        return cache.get(normalizedFen);
    }

    const input = new GetItemCommand({
        Key: {
            normalizedFen: {
                S: normalizedFen,
            },
            id: {
                S: 'POSITION',
            },
        },
        TableName: isMastersTable ? mastersTable : explorerTable,
    });

    const output = await dynamo.send(input);
    if (!output.Item) {
        return undefined;
    }

    const position = unmarshall(output.Item) as ExplorerPosition;
    cache.set(normalizedFen, position);
    return position;
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
    game: Game,
    update: ExplorerPositionUpdate,
): Promise<boolean> {
    if (!update.newResult) {
        throw new Error(
            'ERROR: setExplorerPosition called with update where newResult is undefined',
        );
    }

    const cohort = getExplorerCohort(game);
    const isMastersTable = cohort.startsWith('masters');
    try {
        const initialExplorerPosition = getInitialExplorerPosition(update, cohort);

        await dynamo.send(
            new PutItemCommand({
                Item: marshall(initialExplorerPosition),
                ConditionExpression: 'attribute_not_exists(normalizedFen)',
                TableName: isMastersTable ? mastersTable : explorerTable,
            }),
        );
        return true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            // This should be rare, as it only happens when two games with the same
            // new position are added simultaneously
            return await updateExplorerPosition(cohort, update, undefined);
        }
        throw new Error(`ERROR: Failed to set explorer position: ${update}\r\r${err}`);
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
 * Returns an ExplorerPosition object initialized with the data in the update.
 * @param chess A Chess.ts instance to use when generating the list of legal moves in the position.
 * @param update The ExplorerPositionUpdate to apply to a blank ExplorerPosition.
 * @param cohort The cohort the update applies to.
 * @returns An ExplorerPosition object initialized with the given update data.
 */
function getInitialExplorerPosition(
    update: ExplorerPositionUpdate,
    cohort: string,
): ExplorerPosition {
    const chess = new Chess({ fen: update.normalizedFen });
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

    const explorerPosition = {
        normalizedFen: update.normalizedFen,
        id: 'POSITION',
        results: {
            [cohort]: {
                [update.newResult!]: 1,
            },
        },
        moves: explorerMoves,
    };

    for (const move of Object.values(update.moves)) {
        explorerPosition.moves[move.san].results[cohort] = {
            [move.newResult!]: 1,
        };
    }

    return explorerPosition;
}

/**
 * Updates an existing ExplorerPosition with the provided update.
 * @param cohort The cohort the update applies to.
 * @param update The update to apply to the ExplorerPosition.
 * @param position The current ExplorerPosition in the database.
 * @returns True if the update was successfully applied.
 */
async function updateExplorerPosition(
    cohort: string,
    update: ExplorerPositionUpdate,
    position: ExplorerPosition | undefined,
): Promise<boolean> {
    if (await setExplorerPositionCohort(cohort, update, position)) {
        return true;
    }

    let updateExpression: string;
    const expressionAttrValues: Record<string, AttributeValue> = {};
    const expressionAttrNames: Record<string, string> = {
        '#cohort': cohort,
    };

    if (update.oldResult && !update.newResult) {
        // The position was removed or the game as a whole was deleted
        updateExpression = `ADD results.#cohort.${update.oldResult} :dec, `;
        expressionAttrValues[':dec'] = { N: '-1' };
    } else if (update.oldResult !== update.newResult) {
        // The game's entire result was modified
        updateExpression = `ADD results.#cohort.${update.newResult} :inc, `;
        if (update.oldResult) {
            updateExpression += `results.#cohort.${update.oldResult} :dec, `;
            expressionAttrValues[':dec'] = { N: '-1' };
        }
        expressionAttrValues[':inc'] = { N: '1' };
    } else {
        // There was no change to the game's result, but there are changes to the moves
        updateExpression = `ADD `;
    }

    Object.values(update.moves).forEach((move, index) => {
        if (move.oldResult && move.oldResult !== move.newResult) {
            // The move was removed or the result was changed
            updateExpression += `moves.#san${index}.results.#cohort.${move.oldResult} :dec, `;
            expressionAttrValues[':dec'] = { N: '-1' };
        }
        if (move.newResult) {
            // The move was added or its result changed
            updateExpression += `moves.#san${index}.results.#cohort.${move.newResult} :inc, `;
            expressionAttrValues[':inc'] = { N: '1' };
        }
        expressionAttrNames[`#san${index}`] = move.san;
    });

    updateExpression = updateExpression.substring(
        0,
        updateExpression.length - ', '.length,
    );

    const isMastersTable = cohort.startsWith('masters');
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
        ExpressionAttributeNames: expressionAttrNames,
        ExpressionAttributeValues: expressionAttrValues,
        TableName: isMastersTable ? mastersTable : explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        return true;
    } catch (err) {
        console.log(
            'ERROR: Failed to update explorer position %j with input %j: ',
            update,
            input,
            err,
        );
        throw err;
    }
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

    const isMastersTable = cohort.startsWith('masters');
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
        TableName: isMastersTable ? mastersTable : explorerTable,
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

/**
 * Merges the given update into the cache of batch position updates.
 * @param positionUpdates The cache of batch position updates.
 * @param update The update to apply to the cache.
 * @param cohort The cohort the update applies to.
 */
function mergeUpdate(
    positionUpdates: Map<string, ExplorerPosition>,
    update: ExplorerPositionUpdate,
    cohort: string,
) {
    if (!positionUpdates.has(update.normalizedFen)) {
        positionUpdates.set(update.normalizedFen, {
            normalizedFen: update.normalizedFen,
            id: '',
            results: {},
            moves: {},
        });
    }

    const currentUpdates = positionUpdates.get(update.normalizedFen);
    if (!currentUpdates) {
        throw new Error('currentUpdates is undefined');
    }

    if (update.oldResult) {
        if (!currentUpdates.results[cohort]) {
            currentUpdates.results[cohort] = {};
        }
        currentUpdates.results[cohort][update.oldResult] =
            (currentUpdates.results[cohort][update.oldResult] ?? 0) - 1;
    }

    if (update.newResult) {
        if (!currentUpdates.results[cohort]) {
            currentUpdates.results[cohort] = {};
        }
        currentUpdates.results[cohort][update.newResult] =
            (currentUpdates.results[cohort][update.newResult] ?? 0) + 1;
    }

    update.moves.forEach((move) => {
        if (!currentUpdates.moves[move.san]) {
            currentUpdates.moves[move.san] = {
                san: move.san,
                results: {},
            };
        }
        const updateMove = currentUpdates.moves[move.san];

        if (move.oldResult) {
            if (!updateMove.results[cohort]) {
                updateMove.results[cohort] = {};
            }
            updateMove.results[cohort][move.oldResult] =
                (updateMove.results[cohort][move.oldResult] ?? 0) - 1;
        }

        if (move.newResult) {
            if (!updateMove.results[cohort]) {
                updateMove.results[cohort] = {};
            }
            updateMove.results[cohort][move.newResult] =
                (updateMove.results[cohort][move.newResult] ?? 0) + 1;
        }
    });
}

/**
 * Applies the given batch updates to the explorer database.
 * @param updates The updates to apply.
 */
async function applyBatchUpdates(updates: Map<string, ExplorerPosition>) {
    for (const update of updates.values()) {
        await applyBatchUpdate(update);
    }
}

/**
 * Applies a batch update to an ExplorerPosition. The update is applied separately
 * for the masters and non-masters cohorts.
 * @param update The update to apply.
 */
async function applyBatchUpdate(update: ExplorerPosition) {
    await Promise.all([
        applyBatchUpdateTable(update, mastersTable, (cohort) =>
            cohort.startsWith('masters'),
        ),
        applyBatchUpdateTable(
            update,
            explorerTable,
            (cohort) => !cohort.startsWith('masters'),
        ),
    ]);
}

/**
 * Applies a batch update to the given table using the given cohortPredicate function.
 * If the cohortPredicate returns false for a given cohort, then that cohort's results
 * are not included in the update.
 * @param update The update to apply.
 * @param table The table to apply the update to.
 * @param cohortPredicate The cohort predicate function to check updates against.
 */
async function applyBatchUpdateTable(
    update: ExplorerPosition,
    table: string,
    cohortPredicate: (cohort: string) => boolean,
) {
    let updateExpression = 'ADD ';
    const expressionAttrValues: Record<string, AttributeValue> = {};
    const expressionAttrNames: Record<string, string> = {};

    let nameIdx = 0;
    let valIdx = 0;

    for (const [cohort, results] of Object.entries(update.results)) {
        if (!cohortPredicate(cohort)) {
            continue;
        }

        for (const [resultName, count] of Object.entries(results)) {
            updateExpression += `results.#n${nameIdx}.${resultName} :v${valIdx}, `;
            expressionAttrNames[`#n${nameIdx}`] = cohort;
            expressionAttrValues[`:v${valIdx}`] = {
                N: `${count}`,
            };
            nameIdx++;
            valIdx++;
        }
    }

    Object.values(update.moves).forEach((move, moveIdx) => {
        for (const [cohort, results] of Object.entries(move.results)) {
            if (!cohortPredicate(cohort)) {
                continue;
            }

            for (const [resultName, count] of Object.entries(results)) {
                updateExpression += `moves.#san${moveIdx}.results.#n${nameIdx}.${resultName} :v${valIdx}, `;
                expressionAttrNames[`#san${moveIdx}`] = move.san;
                expressionAttrNames[`#n${nameIdx}`] = cohort;
                expressionAttrValues[`:v${valIdx}`] = {
                    N: `${count}`,
                };
                nameIdx++;
                valIdx++;
            }
        }
    });

    if (nameIdx === 0) {
        return;
    }

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
        ExpressionAttributeNames: expressionAttrNames,
        ExpressionAttributeValues: expressionAttrValues,
        TableName: table,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
    } catch (err) {
        console.log(
            'ERROR: Failed to update explorer position %j with input %j: ',
            update,
            input,
            err,
        );
        throw err;
    }
}

/**
 * Sets or removes the ExplorerGame associated with this game and update as necessary.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 * @returns
 */
async function updateExplorerGame(game: Game, update: ExplorerPositionUpdate) {
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
async function putExplorerGame(game: Game, update: ExplorerPositionUpdate) {
    if (update.normalizedFen === STARTING_POSITION_FEN) {
        return;
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
        const isMastersTable = game.cohort.startsWith('masters');
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(explorerGame, { removeUndefinedValues: true }),
                TableName: isMastersTable ? mastersTable : explorerTable,
            }),
        );
    } catch (err) {
        console.log('ERROR: Failed to set explorer game %j: ', explorerGame, err);
    }
}

/**
 * Removes the ExplorerGame in the database associated with this game and update. If the
 * position is the starting position, then the update is skipped.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function removeExplorerGame(game: Game, update: ExplorerPositionUpdate) {
    if (update.normalizedFen === STARTING_POSITION_FEN) {
        return;
    }

    try {
        const id = `GAME#${getExplorerCohort(game)}#${game.id}`;
        const isMastersTable = game.cohort.startsWith('masters');
        await dynamo.send(
            new DeleteItemCommand({
                Key: {
                    normalizedFen: { S: update.normalizedFen },
                    id: { S: id },
                },
                TableName: isMastersTable ? mastersTable : explorerTable,
            }),
        );
    } catch (err) {
        console.log('ERROR: Failed to delete explorer game: ', err);
    }
}
