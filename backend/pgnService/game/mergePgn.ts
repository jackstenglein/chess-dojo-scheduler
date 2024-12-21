import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess, DiagramComment, Move } from '@jackstenglein/chess';
import {
    PgnMergeRequest,
    PgnMergeSchema,
    PgnMergeType,
    PgnMergeTypes,
} from '@jackstenglein/chess-dojo-common/src/pgn/merge';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    getUserInfo,
    parseBody,
    success,
} from 'chess-dojo-directory-service/api';
import { dynamo, gamesTable } from './create';
import { Game } from './types';

const frontendHost = process.env['frontendHost'];

/**
 * Lambda handler that merges a PGN into an existing game.
 * @param event The event that triggered the Lambda.
 * @returns The cohort and id of the updated game.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = getUserInfo(event);
        const request = parseBody(event, PgnMergeSchema);
        const source = new Chess({ pgn: request.pgn });
        const game = await getGame(request.cohort, request.id);

        if (game.owner !== userInfo.username) {
            throw new ApiError({
                statusCode: 403,
                publicMessage: 'Permission denied: you are not the owner of this game',
            });
        }

        const target = new Chess({ pgn: game.pgn });
        const newPgn = mergePgn(source, target, request);
        await updateGame(request.cohort, request.id, newPgn);

        return success({ cohort: request.cohort, id: request.id });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Gets the game with the provided cohort and id. Only the owner and pgn fields
 * are returned.
 * @param cohort The cohort of the game.
 * @param id The id of the game.
 * @returns The owner and pgn fields of the game.
 */
async function getGame(cohort: string, id: string): Promise<Pick<Game, 'owner' | 'pgn'>> {
    const input = new GetItemCommand({
        Key: {
            cohort: { S: cohort },
            id: { S: id },
        },
        ProjectionExpression: '#owner, #pgn',
        ExpressionAttributeNames: {
            '#owner': 'owner',
            '#pgn': 'pgn',
        },
        TableName: gamesTable,
    });

    const response = await dynamo.send(input);
    if (!response.Item) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `Game ${cohort}/${id} not found`,
        });
    }

    return unmarshall(response.Item) as Pick<Game, 'owner' | 'pgn'>;
}

/**
 * Sets the PGN in the game with the provided cohort and id. None of the PGN headers
 * can change as a result of the merge, so no other fields need to be updated.
 * @param cohort The cohort of the game.
 * @param id The id of the game.
 * @param pgn The PGN to set on the game.
 */
async function updateGame(cohort: string, id: string, pgn: string) {
    const input = new UpdateItemCommand({
        Key: {
            cohort: { S: cohort },
            id: { S: id },
        },
        UpdateExpression: 'set #pgn = :pgn, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#pgn': 'pgn',
            '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
            ':pgn': { S: pgn },
            ':updatedAt': { S: new Date().toISOString() },
        },
        TableName: gamesTable,
        ReturnValues: 'NONE',
    });
    await dynamo.send(input);
}

/**
 * Merges the source Chess into the target Chess and returns the final target PGN.
 * @param source The source Chess to merge into the target.
 * @param target The target Chess to merge the source into.
 * @param request The merge options.
 * @returns The final target PGN.
 */
function mergePgn(source: Chess, target: Chess, request: PgnMergeRequest): string {
    source.seek(null);
    target.seek(null);

    if (source.normalizedFen() !== target.normalizedFen()) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Unable to merge: the games do not start from the same position',
        });
    }

    recursiveMergeLine(source.history(), source, target, null, request);
    return target.renderPgn();
}

/**
 * Recursively merges the given line into the target Chess instance.
 * @param line The line to merge into the Chess instance.
 * @param source The source Chess to merge into the target.
 * @param target The target Chess to merge the line into.
 * @param currentTargetMove The current move to start from in the target Chess.
 * @param request The merge options.
 */
function recursiveMergeLine(
    line: Move[],
    source: Chess,
    target: Chess,
    currentTargetMove: Move | null,
    request: PgnMergeRequest,
) {
    for (const move of line) {
        const newTargetMove = target.move(move.san, {
            previousMove: currentTargetMove,
            skipSeek: true,
        });
        if (!newTargetMove) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `Unable to merge: invalid move ${move.san} at ply ${move.ply}`,
            });
        }

        mergeComments(move, newTargetMove, request.commentMergeType);
        mergeNags(move, newTargetMove, request.nagMergeType);
        mergeDrawables(move, newTargetMove, request.drawableMergeType);

        for (const variation of move.variations) {
            recursiveMergeLine(variation, source, target, currentTargetMove, request);
        }

        currentTargetMove = newTargetMove;
    }

    if (
        request.citeSource &&
        request.sourceCohort &&
        request.sourceId &&
        currentTargetMove
    ) {
        const white = getPlayer(
            source.header().tags.White,
            source.header().tags.WhiteElo?.value,
        );
        const black = getPlayer(
            source.header().tags.Black,
            source.header().tags.BlackElo?.value,
        );
        const date = source.header().getRawValue('Date');
        const comment = `[${white} - ${black}${date ? ` ${date}` : ''}](${frontendHost}/games/${request.sourceCohort}/${request.sourceId})`;

        if (currentTargetMove.commentAfter) {
            currentTargetMove.commentAfter += `\n\n${comment}`;
        } else {
            currentTargetMove.commentAfter = comment;
        }
    }
}

/**
 * Returns a display string for the given player/ELO.
 * @param name The name of the player.
 * @param elo The ELO of the player.
 */
function getPlayer(name: string | undefined, elo: string | undefined): string {
    let result = name || 'NN';
    if (elo) {
        return `${result} (${elo})`;
    }
    return result;
}

/**
 * Merges the comments from the given source move into the target move.
 */
function mergeComments(source: Move, target: Move, mergeType: PgnMergeType) {
    if (mergeType === PgnMergeTypes.DISCARD) {
        return;
    }

    if (source.commentAfter) {
        if (mergeType === PgnMergeTypes.OVERWRITE || !target.commentAfter) {
            target.commentAfter = source.commentAfter;
        } else {
            target.commentAfter += `\n\n${source.commentAfter}`;
        }
    }

    if (source.commentMove) {
        if (mergeType === PgnMergeTypes.OVERWRITE || !target.commentMove) {
            target.commentMove = source.commentMove;
        } else {
            target.commentMove += `\n\n${source.commentMove}`;
        }
    }
}

/**
 * Merges the NAGs from the given source move into the target move.
 */
function mergeNags(source: Move, target: Move, mergeType: PgnMergeType) {
    if (mergeType === PgnMergeTypes.DISCARD) {
        return;
    }

    if (source.nags) {
        if (mergeType === PgnMergeTypes.OVERWRITE || !target.nags) {
            target.nags = source.nags;
        } else {
            target.nags.push(...source.nags);
            target.nags = target.nags.filter(
                (nag, index) => target.nags?.indexOf(nag) === index,
            );
        }
    }
}

/**
 * Merges the color arrows and color fields from the given source move into the target move.
 */
function mergeDrawables(source: Move, target: Move, mergeType: PgnMergeType) {
    if (mergeType === PgnMergeTypes.DISCARD) {
        return;
    }

    if (source.commentDiag?.colorArrows) {
        if (mergeType === PgnMergeTypes.OVERWRITE || !target.commentDiag?.colorArrows) {
            target.commentDiag = {
                ...target.commentDiag,
                colorArrows: source.commentDiag.colorArrows,
            } as DiagramComment;
        } else {
            target.commentDiag.colorArrows.push(...source.commentDiag.colorArrows);
            target.commentDiag.colorArrows = target.commentDiag.colorArrows.filter(
                (arrow, index) =>
                    target.commentDiag?.colorArrows?.indexOf(arrow) === index,
            );
        }
    }

    if (source.commentDiag?.colorFields) {
        if (mergeType === PgnMergeTypes.OVERWRITE || !target.commentDiag?.colorFields) {
            target.commentDiag = {
                ...target.commentDiag,
                colorFields: source.commentDiag.colorFields,
            } as DiagramComment;
        } else {
            target.commentDiag.colorFields.push(...source.commentDiag.colorFields);
            target.commentDiag.colorFields = target.commentDiag.colorFields.filter(
                (arrow, index) =>
                    target.commentDiag?.colorFields?.indexOf(arrow) === index,
            );
        }
    }
}
