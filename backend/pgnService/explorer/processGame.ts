'use strict';

import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import {
    AttributeValue,
    DynamoDBClient,
    UpdateItemCommand,
    PutItemCommand,
    DeleteItemCommand,
    ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import deepEqual from 'deep-equal';

import {
    ExplorerGame,
    ExplorerMove,
    ExplorerResult,
    ExplorerPosition,
    Game,
    GameResult,
    normalizeFen,
} from './types';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';

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

const dojoCohorts: string[] = [
    '0-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-900',
    '900-1000',
    '1000-1100',
    '1100-1200',
    '1200-1300',
    '1300-1400',
    '1400-1500',
    '1500-1600',
    '1600-1700',
    '1700-1800',
    '1800-1900',
    '1900-2000',
    '2000-2100',
    '2100-2200',
    '2200-2300',
    '2300-2400',
    '2400+',
];

/**
 * Extracts the positions from a list of Games and saves them to the explorer table.
 * @param event The DynamoDB stream event that triggered this Lambda. It contains the Game table objects.
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    console.log('Event: %j', event);

    for (const record of event.Records) {
        await processRecord(record);
    }
};

/**
 * Extracts the positions from a single Game and saves or removes them as necessary.
 * @param record A single DynamoDB stream record to extract positions from.
 */
async function processRecord(record: DynamoDBRecord) {
    console.log('record: %j', record);
    console.log('record.dynamodb: %j', record.dynamodb);

    const oldGame = record.dynamodb?.OldImage
        ? (unmarshall(record.dynamodb.OldImage as Record<string, AttributeValue>) as Game)
        : undefined;
    const newGame = record.dynamodb?.NewImage
        ? (unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>) as Game)
        : undefined;

    const game = newGame || oldGame;
    if (!game) {
        console.log('Neither new game nor old game are present, skipping');
        return;
    }

    if (oldGame?.pgn === newGame?.pgn) {
        console.log('PGN was not updated, skipping');
        return;
    }

    const oldExplorerPositions = extractPositions(oldGame?.pgn);
    const newExplorerPositions = extractPositions(newGame?.pgn);
    const updates = getUpdates(oldExplorerPositions, newExplorerPositions);

    console.log('Old positions: ', oldExplorerPositions);
    console.log('New positions: ', newExplorerPositions);
    console.log('Final updates: %j', updates);
    console.log('Length of updates: ', updates.length);

    const chess = new Chess();
    const promises: Promise<boolean>[] = [];
    for (const update of Object.values(updates)) {
        promises.push(writeExplorerPosition(game, chess, update));
    }
    const results = await Promise.allSettled(promises);
    console.log('Finished with results: ', results);
}

/**
 * Extracts all ExplorerPositionUpdates from the given PGN.
 * @param pgn The PGN to extract ExplorerPositionUpdates from.
 * @returns A map from normalized FEN to ExplorerPositionUpdate.
 */
function extractPositions(pgn?: string): Record<string, ExplorerPositionExtraction> {
    if (!pgn) {
        return {};
    }

    const chess = new Chess({ pgn });
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
    explorerPositions: Record<string, ExplorerPositionExtraction>
) {
    const normalizedFen = normalizeFen(chess.fen());
    const isMainline = chess.isInMainline();

    const explorerPosition: ExplorerPositionExtraction = explorerPositions[
        normalizedFen
    ] || {
        normalizedFen,
        result: isMainline ? getExplorerMoveResult(chess.header().Result) : 'analysis',
        moves: {},
    };
    explorerPositions[normalizedFen] = explorerPosition;

    const nextMove = chess.nextMove();
    if (nextMove) {
        if (isMainline || !explorerPosition.moves[nextMove.san]) {
            explorerPosition.moves[nextMove.san] = {
                san: nextMove.san,
                result: isMainline
                    ? getExplorerMoveResult(chess.header().Result)
                    : 'analysis',
            };
        }
        chess.seek(nextMove);
        extractPositionRecursive(chess, explorerPositions);

        for (const variation of nextMove.variations || []) {
            if (variation[0]) {
                if (!explorerPosition.moves[variation[0].san]) {
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
    newPositions: Record<string, ExplorerPositionExtraction>
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
function getExplorerMoveResult(result: string): keyof ExplorerResult {
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
 * @param chess The Chess.ts instance to use when generating initial ExplorerPosition moves.
 * @param update The update to apply to the ExplorerPosition.
 */
async function writeExplorerPosition(
    game: Game,
    chess: Chess,
    update: ExplorerPositionUpdate
): Promise<boolean> {
    if (!update.newResult && !update.oldResult) {
        console.error('update does not contain newResult nor oldResult');
        return false;
    }

    let success = false;
    if (update.oldResult) {
        success = await updateExplorerPosition(game.cohort, update);
    } else {
        success = await setOrUpdateExplorerPosition(game, chess, update);
    }

    if (success) {
        updateExplorerGame(game, update);
    }
    return success;
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
    chess: Chess,
    update: ExplorerPositionUpdate
): Promise<boolean> {
    if (!update.newResult) {
        console.error(
            'setExplorerPosition called with update where newResult is undefined'
        );
        return false;
    }

    try {
        const initialExplorerPosition = getInitialExplorerPosition(
            chess,
            update,
            game.cohort
        );

        await dynamo.send(
            new PutItemCommand({
                Item: marshall(initialExplorerPosition),
                ConditionExpression: 'attribute_not_exists(normalizedFen)',
                TableName: explorerTable,
            })
        );
        return true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            return await updateExplorerPosition(game.cohort, update);
        }
        console.error('Failed to set explorer position %j: ', update, err);
        return false;
    }
}

/**
 * Returns an ExplorerPosition object initialized with the data in the update.
 * @param chess A Chess.ts instance to use when generating the list of legal moves in the position.
 * @param update The ExplorerPositionUpdate to apply to a blank ExplorerPosition.
 * @param cohort The cohort the update applies to.
 * @returns An ExplorerPosition object initialized with the given update.
 */
function getInitialExplorerPosition(
    chess: Chess,
    update: ExplorerPositionUpdate,
    cohort: string
): ExplorerPosition {
    chess.load(update.normalizedFen);
    const moves = chess.moves();

    const explorerMoves = moves.reduce((map, move) => {
        map[move.san] = {
            san: move.san,
            results: dojoCohorts.reduce((map, c) => {
                map[c] = {};
                return map;
            }, {} as Record<string, ExplorerResult>),
        };
        return map;
    }, {} as Record<string, ExplorerMove>);

    const explorerPosition = {
        normalizedFen: update.normalizedFen,
        id: 'POSITION',
        results: dojoCohorts.reduce((map, c) => {
            map[c] = {};
            return map;
        }, {} as Record<string, ExplorerResult>),
        moves: explorerMoves,
    };

    explorerPosition.results[cohort][update.newResult!] = 1;
    for (const move of Object.values(update.moves)) {
        explorerPosition.moves[move.san].results[cohort][move.newResult!] = 1;
    }

    return explorerPosition;
}

/**
 * Updates an existing ExplorerPosition with the provided update.
 * @param cohort The cohort the update applies to.
 * @param update The update to apply to the ExplorerPosition.
 * @returns True if the update was successfully applied.
 */
async function updateExplorerPosition(
    cohort: string,
    update: ExplorerPositionUpdate
): Promise<boolean> {
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
        updateExpression.length - ', '.length
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
        TableName: explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        return true;
    } catch (err) {
        console.error(
            'Failed to update explorer position %j with input %j: ',
            update,
            input,
            err
        );
        return false;
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
 * Sets the ExplorerGame in the database associated with this game and update.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function putExplorerGame(game: Game, update: ExplorerPositionUpdate) {
    try {
        const id = `GAME#${game.cohort}#${game.id}`;
        const explorerGame: ExplorerGame = {
            normalizedFen: update.normalizedFen,
            id,
            cohort: game.cohort,
            owner: game.owner,
            ownerDisplayName: game.ownerDisplayName,
            result: update.newResult!,
            game: {
                ...game,
                pgn: '',
            },
        };

        await dynamo.send(
            new PutItemCommand({
                Item: marshall(explorerGame),
                TableName: explorerTable,
            })
        );
    } catch (err) {
        console.error('Failed to set explorer game: ', err);
    }
}

/**
 * Removes the ExplorerGame in the database associated with this game and update.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function removeExplorerGame(game: Game, update: ExplorerPositionUpdate) {
    try {
        const id = `GAME#${game.cohort}#${game.id}`;
        await dynamo.send(
            new DeleteItemCommand({
                Key: {
                    normalizedFen: { S: update.normalizedFen },
                    id: { S: id },
                },
                TableName: explorerTable,
            })
        );
    } catch (err) {
        console.error('Failed to delete explorer game: ', err);
    }
}
