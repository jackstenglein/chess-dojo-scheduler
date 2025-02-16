import {
    AttributeValue,
    QueryCommand,
    QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { ExplorerPositionFollower } from '@jackstenglein/chess-dojo-common/src/explorer/follower';
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import { UpdateItemBuilder, dynamo } from 'chess-dojo-directory-service/database';
import { explorerTable } from './listGames';
import { ExplorerGame, dojoCohorts } from './types';

const notificationTable = process.env.stage + '-notifications';

/**
 * Stored as a global variable so that it persists between consecutive
 * Lambda invocations.
 */
const knownFollowers = new Map<string, ExplorerPositionFollower[]>();

/**
 * Extracts the ExplorerGames from a list of inserted Explorer objects and saves notifications for them.
 * @param event The DynamoDB stream event that triggered this Lambda. It contains the Explorer table objects.
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    console.log('Event: %j', event);

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (err) {
            console.error('Failed to process record %j: ', record, err);
        }
    }
};

/**
 * Notifies all followers of a position about new games in that position.
 * @param record A single DynamoDB stream record to notify users about.
 */
async function processRecord(record: DynamoDBRecord) {
    if (!record.dynamodb?.NewImage) {
        console.log('Skipping record as it has no NewImage');
        return;
    }

    const game = unmarshall(
        record.dynamodb.NewImage as Record<string, AttributeValue>,
    ) as ExplorerGame;

    if (!game.id || !game.id.startsWith('GAME#')) {
        console.log('Skipping record as its id does not start with GAME#');
        return;
    }

    const normalizedFen = game.normalizedFen;
    if (!normalizedFen) {
        console.log('Skipping record as it has no normalizedFen');
        return;
    }

    if (!knownFollowers.has(normalizedFen)) {
        const followers = await fetchFollowers(normalizedFen);
        knownFollowers.set(normalizedFen, followers);
    }

    const followers = knownFollowers.get(normalizedFen);
    await processFollowers(game, followers);
}

/**
 * Returns a list of the followers for the provided FEN.
 * @param normalizedFen The FEN to fetch followers for.
 * @returns A list of the followers.
 */
async function fetchFollowers(
    normalizedFen: string,
): Promise<ExplorerPositionFollower[]> {
    let startKey: Record<string, AttributeValue> | undefined = undefined;
    const result: ExplorerPositionFollower[] = [];

    do {
        console.log('Fetching followers for FEN: ', normalizedFen);

        const queryOutput: QueryCommandOutput = await dynamo.send(
            new QueryCommand({
                KeyConditionExpression: `#fen = :fen AND begins_with ( #id, :id )`,
                ExpressionAttributeNames: {
                    '#fen': 'normalizedFen',
                    '#id': 'id',
                },
                ExpressionAttributeValues: {
                    ':fen': { S: normalizedFen },
                    ':id': { S: 'FOLLOWER#' },
                },
                ExclusiveStartKey: startKey,
                TableName: explorerTable,
            }),
        );

        queryOutput.Items?.forEach((item) =>
            result.push(unmarshall(item) as ExplorerPositionFollower),
        );
        startKey = queryOutput.LastEvaluatedKey;
    } while (startKey);

    return result;
}

/**
 * Creates notifications for the provided ExplorerGame for each of the provided followers
 * as necessary. The follower configuration is respected (IE: minCohort, maxCohort, etc).
 * @param game The ExplorerGame that generated the notifications.
 * @param followers The followers to create notifications for.
 * @returns A void promise.
 */
async function processFollowers(
    game: ExplorerGame,
    followers: ExplorerPositionFollower[] | undefined,
) {
    if (!followers || followers.length === 0) {
        return;
    }

    for (const follower of followers) {
        if (game.cohort === 'masters') {
            await processMasterGame(follower, game);
        } else {
            await processDojoGame(follower, game);
        }
    }
}

/**
 * Saves a notification for a Masters game, if necessary.
 * @param follower The follower to potentially notify.
 * @param game The game to notify the follower of.
 */
async function processMasterGame(follower: ExplorerPositionFollower, game: ExplorerGame) {
    const metadata = follower.followMetadata?.masters;
    if (!metadata?.enabled) {
        return;
    }
    if (
        metadata.timeControls &&
        !metadata.timeControls.includes(game.game.timeClass?.toLowerCase() || '')
    ) {
        return;
    }
    if (metadata.minAverageRating) {
        const avg =
            (parseInt(game.game.headers.WhiteElo || '0') +
                parseInt(game.game.headers.BlackElo || '0')) /
            2;
        if (isNaN(avg) || avg < metadata.minAverageRating) {
            return;
        }
    }

    await saveNotification(follower, game);
}

/**
 * Saves a notification for a Dojo game, if necessary.
 * @param follower The follower to potentially notify.
 * @param game The game to notify the follower of.
 */
async function processDojoGame(follower: ExplorerPositionFollower, game: ExplorerGame) {
    const metadata = follower.followMetadata?.dojo;
    if (!metadata?.enabled) {
        return;
    }
    if (metadata.disableVariations && game.result === 'analysis') {
        return;
    }
    if (
        metadata.minCohort &&
        dojoCohorts.indexOf(metadata.minCohort) > dojoCohorts.indexOf(game.cohort)
    ) {
        return;
    }
    if (
        metadata.maxCohort &&
        dojoCohorts.indexOf(metadata.maxCohort) < dojoCohorts.indexOf(game.cohort)
    ) {
        return;
    }

    await saveNotification(follower, game);
}

/**
 * Saves a notification for the given follower and game.
 * @param follower The follower to notify.
 * @param game The game to notify the follower of.
 */
async function saveNotification(follower: ExplorerPositionFollower, game: ExplorerGame) {
    const input = new UpdateItemBuilder()
        .key('username', follower.follower)
        .key('id', follower.normalizedFen)
        .set('type', 'EXPLORER_GAME')
        .set('updatedAt', new Date().toISOString())
        .add('count', 1)
        .appendToList('explorerGameMetadata', [game.game])
        .table(notificationTable)
        .build();

    try {
        console.log('Input: %j', input);
        await dynamo.send(input);
    } catch (err) {
        console.error('Failed to save notification with input %j: ', input, err);
    }
}
