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

/** Caches positions already known to exist in DynamoDB. */
interface KnownPositionsCache {
    /** Known positions in the masters database. */
    masters: Map<string, ExplorerPosition>;

    /** Known positions in the dojo database. */
    dojo: Map<string, ExplorerPosition>;
}

// Stored as a global variable so that it persists between consecutive
// lambda invocations.
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
        await processRecord(record, positionUpdates);
    }

    console.log(
        `Applying updates to ${positionUpdates.size} positions for ${event.Records.length} records`,
    );
    await applyBatchUpdates(positionUpdates);
};

/**
 * Extracts the positions from a single Game and saves or removes them as necessary.
 * @param record A single DynamoDB stream record to extract positions from.
 * @param positionUpdates The cache of position updates across all records in the stream's batch.
 * Maps a normalized FEN to an ExplorerPosition containing the updates.
 */
async function processRecord(
    record: DynamoDBRecord,
    positionUpdates: Map<string, ExplorerPosition>,
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
            promises.push(writeExplorerGame(game, update, positionUpdates));
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
 * Writes the ExplorerGame for the provided ExplorerPositionUpdate to DynamoDB. If successful,
 * the ExplorerPositionUpdate is merged with the cache of position updates.
 * @param game The game that generated the ExplorerPosition.
 * @param update The update to apply to the ExplorerPosition.
 * @param positionUpdates The cache of position updates across all records in the stream's batch.
 */
async function writeExplorerGame(
    game: Game,
    update: ExplorerPositionUpdate,
    positionUpdates: Map<string, ExplorerPosition>,
): Promise<boolean> {
    if (!update.newResult && !update.oldResult) {
        throw new Error('ERROR: update does not contain newResult nor oldResult');
    }

    let success = false;
    if (update.oldResult && !update.newResult) {
        // The position or game was deleted
        success = await removeExplorerGame(game, update);
    } else {
        // The position or game is new or modified
        success = await putExplorerGame(game, update);
    }

    if (success) {
        const cohort = getExplorerCohort(game);
        mergeUpdate(positionUpdates, update, cohort);
    }

    return success;
}

/**
 * Sets the ExplorerGame in the database associated with this game and update. If the position
 * is the starting position, then the update is skipped.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 * @returns True if the update was successful (or unnecessary) and this game should be indexed
 * in the main position object.
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
        const isMastersTable = game.cohort.startsWith('masters');
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(explorerGame, { removeUndefinedValues: true }),
                TableName: isMastersTable ? mastersTable : explorerTable,
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
 * @returns True if the update was successful (or unnecessary) and this game should be indexed
 * in the main position object.
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
        return true;
    } catch (err) {
        console.log('ERROR: Failed to delete explorer game: ', err);
        return false;
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
            id: 'POSITION',
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
 * @param updates The updates to apply. Maps a normalized FEN to an ExplorerPosition containing the updates.
 */
async function applyBatchUpdates(updates: Map<string, ExplorerPosition>) {
    for (const update of updates.values()) {
        try {
            await applyBatchUpdate(update);
        } catch (err) {
            console.error('Failed to apply update: %j', update);
        }
    }
}

/**
 * Applies a batch update to an ExplorerPosition. The update is applied separately
 * for the masters and non-masters cohorts.
 * @param update The update to apply.
 */
async function applyBatchUpdate(update: ExplorerPosition) {
    await Promise.allSettled([
        applyBatchUpdateTable(update, true),
        applyBatchUpdateTable(update, false),
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
async function applyBatchUpdateTable(update: ExplorerPosition, masters: boolean) {
    if (!requiresUpdate(update, masters)) {
        return;
    }

    let attempts = 0;
    let position = await fetchExplorerPosition(update.normalizedFen, masters);

    while (attempts < 3) {
        try {
            if (!position) {
                await setExplorerPosition(update, masters);
            } else {
                await syncExplorerPosition(position, update, masters);
            }

            return;
        } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
                if (!err.Item) {
                    console.log(
                        'ERROR: Failed to sync explorer position. Conditional check failed, but no return values.',
                        update,
                        err,
                    );
                    throw err;
                }

                attempts++;
                position = unmarshall(err.Item) as ExplorerPosition;
                if (masters) {
                    knownPositions.masters.set(position.normalizedFen, position);
                } else {
                    knownPositions.dojo.set(position.normalizedFen, position);
                }
                console.log(
                    'WARN: Conditional check failed for attempt %d on update %j. Got new position: %j',
                    attempts,
                    update,
                    position,
                );
            }

            console.log('ERROR: Failed to update explorer position %j: ', update, err);
            throw err;
        }
    }

    console.log('ERROR: failed all attempts for update %j', update);
}

/**
 * Returns true if the given ExplorerPosition requires update for the given table
 * (masters or dojo).
 * @param update The update to check.
 * @param masters The table to check against.
 * @returns True if the ExplorerPosition requires update for the table.
 */
function requiresUpdate(update: ExplorerPosition, masters: boolean): boolean {
    for (const cohort of Object.keys(update.results)) {
        if (isMastersCohort(cohort) === masters) {
            return true;
        }
    }

    for (const move of Object.values(update.moves)) {
        for (const cohort of Object.keys(move.results)) {
            if (isMastersCohort(cohort) === masters) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Returns true if the given cohort applies to the masters database.
 * @param cohort The cohort to check.
 */
function isMastersCohort(cohort: string): boolean {
    return cohort.startsWith('masters');
}

/**
 * Sets the given position in DynamoDB. Guards against race conditions using the
 * DynamoDB attribute_not_exists conditional operator. This means that this function
 * could fail if another update simultaneously happens to the same position. In this
 * case, a ConditionalCheckFailedException will be thrown, and the error will contain
 * the most up to date version of the DynamoDB item, allowing the caller to retry the
 * save using the syncExplorerPosition function. If the function is successful, the
 * known positions cache is updated with the most recent value.
 * @param position The position to set.
 * @param masters Whether to apply the update to the masters database.
 */
async function setExplorerPosition(position: ExplorerPosition, masters: boolean) {
    await dynamo.send(
        new PutItemCommand({
            Item: marshall(position),
            ConditionExpression: 'attribute_not_exists(normalizedFen)',
            TableName: masters ? mastersTable : explorerTable,
            ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
        }),
    );
    if (masters) {
        knownPositions.masters.set(position.normalizedFen, position);
    } else {
        knownPositions.dojo.set(position.normalizedFen, position);
    }
}

/**
 * Saves the given ExplorerPosition update in the database, syncing it with the given
 * known current position. The update is performed using DynamoDB ADD operations if a
 * given field in the update already exists on the known position. If it does not already
 * exist, then the update is performed using DynamoDB SET operations. The SET operations
 * are guarded against race conditions using the DynamoDB attribute_not_exists conditional
 * operator. This means that this function could fail if another update simultaneously
 * happens to the same position. In this case, a ConditionalCheckFailedException will be
 * thrown, and the error will contain the most up to date version of the DynamoDB item,
 * allowing the caller to retry this function with the new item. If the function is successful,
 * the known positions cache is updated with the most recent value.
 * @param position The current known value of the position in the database.
 * @param update The update to apply.
 * @param masters Whether to apply the update to the masters database.
 */
async function syncExplorerPosition(
    position: ExplorerPosition,
    update: ExplorerPosition,
    masters: boolean,
) {
    let setExpr = '';
    let addExpr = '';
    let conditionExpr = '';

    const attrValues: Record<string, AttributeValue> = {};
    const attrNames: Record<string, string> = {};

    let nameIdx = 0;
    let valIdx = 0;

    for (const [cohort, results] of Object.entries(update.results)) {
        if (position.results[cohort]) {
            for (const [resultName, count] of Object.entries(results)) {
                addExpr += `results.#n${nameIdx}.${resultName} :v${valIdx}, `;
                attrValues[`:v${valIdx}`] = {
                    N: `${count}`,
                };
                valIdx++;
            }
        } else {
            setExpr += `results.#n${nameIdx} = :v${valIdx}, `;
            conditionExpr += `attribute_not_exists(results.#n${nameIdx}) AND `;
            attrValues[`:v${valIdx}`] = {
                M: marshall(results, { removeUndefinedValues: true }),
            };
            valIdx++;
        }

        attrNames[`#n${nameIdx}`] = cohort;
        nameIdx++;
    }

    Object.values(update.moves).forEach((move, moveIdx) => {
        attrNames[`#san${moveIdx}`] = move.san;

        if (!position.moves[move.san]) {
            setExpr += `moves.#san${moveIdx} = :v${valIdx}, `;
            conditionExpr += `attribute_not_exists(moves.#san${moveIdx}) AND `;
            attrValues[`:v${valIdx}`] = {
                M: marshall(move, { removeUndefinedValues: true }),
            };
            valIdx++;
        } else {
            for (const [cohort, results] of Object.entries(move.results)) {
                if (position.moves[move.san].results[cohort]) {
                    for (const [resultName, count] of Object.entries(results)) {
                        addExpr += `moves.#san${moveIdx}.results.#n${nameIdx}.${resultName} :v${valIdx}, `;
                        attrValues[`:v${valIdx}`] = {
                            N: `${count}`,
                        };
                        valIdx++;
                    }
                } else {
                    setExpr += `moves.#san${moveIdx}.results.#n${nameIdx} = :v${valIdx}, `;
                    conditionExpr += `attribute_not_exists(moves.#san${moveIdx}.results.#n${nameIdx}) AND `;
                    attrValues[`:v${valIdx}`] = {
                        M: marshall(results, { removeUndefinedValues: true }),
                    };
                    valIdx++;
                }

                attrNames[`#n${nameIdx}`] = cohort;
                nameIdx++;
            }
        }
    });

    let updateExpression = '';

    if (setExpr !== '') {
        setExpr = 'SET ' + setExpr.slice(0, setExpr.length - ', '.length);
        conditionExpr = conditionExpr.slice(0, conditionExpr.length - ' AND '.length);
        updateExpression = setExpr;
    }
    if (addExpr !== '') {
        updateExpression += ' ADD ' + addExpr.slice(0, addExpr.length - ', '.length);
    }

    const input = new UpdateItemCommand({
        Key: {
            normalizedFen: { S: update.normalizedFen },
            id: { S: 'POSITION' },
        },
        UpdateExpression: updateExpression,
        ConditionExpression: conditionExpr ? conditionExpr : undefined,
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues,
        TableName: masters ? mastersTable : explorerTable,
        ReturnValues: 'ALL_NEW',
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    });
    const result = await dynamo.send(input);
    position = unmarshall(result.Attributes!) as ExplorerPosition;
    if (masters) {
        knownPositions.masters.set(position.normalizedFen, position);
    } else {
        knownPositions.dojo.set(position.normalizedFen, position);
    }
}

/**
 * Fetches the explorer position with the given FEN from the database.
 * If it does not exist, undefined is returned. If the position is already
 * in the knownPositions cache, it is returned unchanged without fetching
 * from the database.
 * @param normalizedFen The normalized FEN to fetch.
 * @param masters Whether to fetch from the masters table or not.
 * @returns The explorer position with the normalized FEN.
 */
async function fetchExplorerPosition(
    normalizedFen: string,
    masters: boolean,
): Promise<ExplorerPosition | undefined> {
    const cache = masters ? knownPositions.masters : knownPositions.dojo;
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
        TableName: masters ? mastersTable : explorerTable,
    });

    const output = await dynamo.send(input);
    if (!output.Item) {
        return undefined;
    }

    const position = unmarshall(output.Item) as ExplorerPosition;
    cache.set(normalizedFen, position);
    return position;
}
