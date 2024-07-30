'use strict';

import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import * as readline from 'readline';
import { get, set } from './cache';
import {
    ExplorerGame,
    ExplorerMove,
    ExplorerPosition,
    ExplorerResult,
    Game,
    GameResult,
} from './types';

const STARTING_POSITION_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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

export let processed = 0;
export let skipped = 0;
const PRINT_MOD = 10_000;

/**
 * Extracts the positions from a single Game and saves or removes them as necessary.
 * @param record A single DynamoDB stream record to extract positions from.
 */
export async function processRecord(fileNum: number, reader: readline.Interface) {
    for await (const line of reader) {
        const item = JSON.parse(line).Item;
        if (item.cohort.S !== 'masters') {
            skipped++;
            continue;
        }

        try {
            const newGame = unmarshall(item) as Game;
            if (
                newGame.headers.Variant &&
                newGame.headers.Variant !== 'Standard' &&
                newGame.headers.Variant !== 'From Position'
            ) {
                skipped++;
                continue;
            }

            const cohort = getExplorerCohort(newGame);
            // console.log('INFO: game (%s, %s)', cohort, newGame.id);

            const newExplorerPositions = extractPositions(newGame);
            const updates = getUpdates({}, newExplorerPositions);

            const promises: Promise<void>[] = [];
            for (const update of updates) {
                promises.push(updatePosition(update, cohort));
            }
            await Promise.all(promises);
        } catch (err) {
            console.log(
                `${new Date().toISOString()} ERROR ${fileNum}: Failed to process record %j: `,
                item,
                err,
            );
        }

        processed++;
        if (processed % PRINT_MOD === 1) {
            console.log(
                `${new Date().toISOString()} INFO ${fileNum}: processed ${processed} games. Skipped ${skipped} games. Total: ${processed + skipped}`,
            );
            console.log(
                `${new Date().toISOString()} INFO ${fileNum}: heap used: ${process.memoryUsage().heapUsed}`,
            );
        }
    }
}

async function updatePosition(update: ExplorerPositionUpdate, cohort: string) {
    let position = await get(update.normalizedFen);
    if (!position) {
        position = getInitialExplorerPosition(update, cohort);
    } else {
        updateExplorerPosition(position, update, cohort);
    }
    await set(position);
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

function positionInvariant(position: ExplorerPosition) {
    const totalResults = Object.values(position.results).reduce(
        (sum, c) => sum + Object.values(c).reduce((s, r) => s + r, 0),
        0,
    );
    const moveResults = Object.values(position.moves).reduce((sum, move) => {
        return (
            sum +
            Object.values(move.results).reduce((sum2, c) => {
                return sum2 + Object.values(c).reduce((s, r) => s + r, 0);
            }, 0)
        );
    }, 0);

    if (totalResults !== moveResults) {
        throw new Error(
            `Total results (${totalResults}) !== move results (${moveResults}) for position ${JSON.stringify(position)}`,
        );
    }
}

/**
 * Returns an ExplorerPosition object initialized with the data in the updates.
 * @param chess A Chess.ts instance to use when generating the list of legal moves in the position.
 * @param updates The ExplorerPositionUpdate to apply to a blank ExplorerPosition.
 * @param cohort The cohort the update applies to.
 * @returns An ExplorerPosition object initialized with the given update data.
 */
function getInitialExplorerPosition(
    update: ExplorerPositionUpdate,
    cohort: string,
): ExplorerPosition {
    const explorerMoves = update.moves.reduce(
        (map, move) => {
            map[move.san] = {
                san: move.san,
                results: {
                    [cohort]: {
                        [move.newResult!]: 1,
                    },
                },
            };
            return map;
        },
        {} as Record<string, ExplorerMove>,
    );

    const explorerPosition: ExplorerPosition = {
        normalizedFen: update.normalizedFen,
        id: 'POSITION',
        results: {
            [cohort]: {
                [update.newResult!]: 1,
            },
        },
        moves: explorerMoves,
    };

    return explorerPosition;
}

function updateExplorerPosition(
    position: ExplorerPosition,
    update: ExplorerPositionUpdate,
    cohort: string,
) {
    if (position.results[cohort]) {
        position.results[cohort][update.newResult!] =
            (position.results[cohort][update.newResult!] ?? 0) + 1;
    } else {
        position.results[cohort] = {
            [update.newResult!]: 1,
        };
    }

    update.moves.forEach((move) => {
        position.moves[move.san] = {
            san: move.san,
            results: {
                ...position.moves[move.san]?.results,
                [cohort]: {
                    ...position.moves[move.san]?.results[cohort],
                    [move.newResult!]:
                        (position.moves[move.san]?.results[cohort]?.[move.newResult!] ??
                            0) + 1,
                },
            },
        };
    });
}

interface DynamoDBJson {
    Item: Record<string, AttributeValue>;
}

/**
 * Sets the ExplorerGame in the database associated with this game and update. If the position
 * is the starting position, then the update is skipped.
 * @param game The game associated with the ExplorerPosition.
 * @param update The update applied to the ExplorerPosition.
 */
function getExplorerGame(
    game: Game,
    update: ExplorerPositionUpdate,
): DynamoDBJson | undefined {
    if (update.normalizedFen === STARTING_POSITION_FEN) {
        return undefined;
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
    return { Item: marshall(explorerGame, { removeUndefinedValues: true }) };
}
