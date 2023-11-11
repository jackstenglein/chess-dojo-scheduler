'use strict';

import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import {
    AttributeValue,
    DynamoDBClient,
    UpdateItemCommand,
    PutItemCommand,
    ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';

import {
    ExplorerGame,
    ExplorerMove,
    ExplorerResult,
    ExplorerPosition,
    ExplorerPositionUpdate,
    Game,
    GameResult,
} from './types';

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
    console.log('Event: ', event);

    for (const record of event.Records) {
        await processRecord(record);
    }
};

/**
 * Extracts the positions from a single Game and saves them to the explorer table.
 * @param record A single DynamoDB stream record to extract positions from.
 */
async function processRecord(record: DynamoDBRecord) {
    console.log('record: ', record);
    console.log('record.dynamodb: ', record.dynamodb);

    if (!record.dynamodb?.NewImage) {
        console.log('Record has no image, skipping');
        return;
    }

    const game = unmarshall(
        record.dynamodb.NewImage as Record<string, AttributeValue>
    ) as Game;
    if (!game.pgn) {
        console.log('Record has empty PGN, skipping');
        return;
    }

    const explorerPositions: Record<string, ExplorerPositionUpdate> = {};

    const chess = new Chess({ pgn: game.pgn });
    chess.seek(null);

    if (chess.history().length === 0) {
        console.log('PGN has no moves, skipping');
        return;
    }

    extractPositionRecursive(chess, explorerPositions);

    console.log('Final explorerPositions: %j', explorerPositions);
    console.log('Length of explorerPositions: ', Object.values(explorerPositions).length);

    const promises: Promise<void>[] = [];
    for (const explorerPosition of Object.values(explorerPositions)) {
        promises.push(setOrUpdateExplorerPosition(game, chess, explorerPosition));
    }
    await Promise.allSettled(promises);
}

/**
 * Recursively extracts all ExplorerPositionUpdates from the given Chess object.
 * @param chess The Chess object to extract positions from.
 * @param explorerPositions A map from normalized FEN to ExplorerPositionUpdate where
 * the extracted updates will be saved.
 */
function extractPositionRecursive(
    chess: Chess,
    explorerPositions: Record<string, ExplorerPositionUpdate>
) {
    const normalizedFen = normalizeFen(chess.fen());
    const isMainline = chess.isInMainline();

    const explorerPosition: ExplorerPositionUpdate = explorerPositions[normalizedFen] || {
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
 * Returns the normalized version of the provided FEN. See the comment on ExplorerPosition for a
 * description of how FENs are normalized.
 * @param fen The FEN to normalize.
 * @returns The normalized FEN.
 */
function normalizeFen(fen: string): string {
    const tokens = fen.split(' ');
    if (tokens.length < 4) {
        throw new Error(`Invalid FEN: '${fen}'. FEN does not have at least 4 tokens.`);
    }

    const pieces = tokens[0];
    const color = tokens[1];
    const castling = tokens[2];
    const enPassant = tokens[3];

    return `${pieces} ${color} ${castling} ${enPassant} 0 1`;
}

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const explorerTable = process.env.stage + '-explorer';

/**
 * Writes the provided ExplorerPositionUpdate to DynamoDB, ensuring that an existing ExplorerPosition
 * for the same FEN is not overwritten. If this is a new ExplorerPosition, then it is created in a
 * way that allows for future updates.
 * @param game The game that generated the ExplorerPosition.
 * @param chess The Chess.ts instance to use when generating initial ExplorerPosition moves.
 * @param update The update to apply to the ExplorerPosition.
 */
async function setOrUpdateExplorerPosition(
    game: Game,
    chess: Chess,
    update: ExplorerPositionUpdate
) {
    const initialExplorerPosition = getInitialExplorerPosition(
        chess,
        update,
        game.cohort
    );

    let success = false;
    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(initialExplorerPosition),
                ConditionExpression: 'attribute_not_exists(normalizedFen)',
                TableName: explorerTable,
            })
        );
        console.log('Successfully set initial explorer position: %j', update);
        success = true;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            success = await updateExplorerPosition(game.cohort, update);
        } else {
            console.error('Failed to update explorer position %j: ', update, err);
        }
    }

    if (success) {
        putExplorerGame(game, update);
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

    explorerPosition.results[cohort][update.result] = 1;
    for (const move of Object.values(update.moves)) {
        explorerPosition.moves[move.san].results[cohort][move.result] = 1;
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
    let updateExpression = `ADD results.#cohort.${update.result} :v, `;
    const expressionAttrNames: Record<string, string> = {
        '#cohort': cohort,
    };
    Object.values(update.moves).forEach((move, index) => {
        updateExpression += `moves.#san${index}.results.#cohort.${move.result} :v, `;
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
        ExpressionAttributeValues: {
            ':v': { N: '1' },
        },
        TableName: explorerTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
        console.log('Successfully updated existing explorer position: %j', update);
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
 * Sets the ExplorerGame in the database associated with this game and update.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
async function putExplorerGame(game: Game, update: ExplorerPositionUpdate) {
    const id = `GAME#${game.cohort}#${game.id}`;
    const explorerGame: ExplorerGame = {
        normalizedFen: update.normalizedFen,
        id,
        cohort: game.cohort,
        owner: game.owner,
        ownerDisplayName: game.ownerDisplayName,
        result: update.result,
        game,
    };

    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(explorerGame),
                TableName: explorerTable,
            })
        );
    } catch (err) {
        console.error('Failed to set explorer game %j: ', explorerGame, err);
    }
}
