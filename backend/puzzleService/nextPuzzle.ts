import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    getPuzzleOverview,
    PuzzleThemeOverview,
    User,
} from '@jackstenglein/chess-dojo-common/src/database/user';
import {
    NextPuzzleRequest,
    nextPuzzleRequestSchema,
    Puzzle,
    PuzzleHistory,
} from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { Glicko2 } from 'glicko2';
import { MongoClient, ServerApiVersion, WithId } from 'mongodb';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from '../directoryService/api';
import { dynamo, UpdateItemBuilder } from '../directoryService/database';

const userTable = `${process.env.stage}-users`;
const puzzleResultsTable = `${process.env.stage}-puzzle-results`;

const mongoClient = new MongoClient(process.env.MONGODB_URI ?? '', {
    auth: {
        username: process.env.AWS_ACCESS_KEY_ID,
        password: process.env.AWS_SECRET_ACCESS_KEY,
    },
    authSource: '$external',
    authMechanism: 'MONGODB-AWS',
    authMechanismProperties: {
        AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
    },
    maxIdleTimeMS: 60000,
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const request = parseEvent(event, nextPuzzleRequestSchema);
        const userInfo = requireUserInfo(event);
        let user = await fetchUser(userInfo.username);

        if (request.previousPuzzle) {
            user = await handlePreviousPuzzle(request.previousPuzzle, user);
        }

        const rating = getPuzzleOverview(user, 'OVERALL').rating;
        const minRatingAdjustment = request.relativeRating?.[0] ?? -200;
        const maxRatingAdjustment = request.relativeRating?.[1] ?? 200;
        const cursor = mongoClient
            .db('puzzles')
            .collection('puzzles')
            .aggregate([
                {
                    $match: {
                        themes: { $in: request.themes ?? ['mate'] },
                        rating: {
                            $gte: Math.max(0, rating + minRatingAdjustment),
                            $lte: rating + maxRatingAdjustment,
                        },
                    },
                },
                { $sample: { size: 5 } },
            ]);
        const document = await cursor.next();
        return success({
            puzzle: { plays: 0, successfulPlays: 0, id: document?._id, ...document },
            user,
        });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Fetches the given username from Dynamo. Only the fields relevant to puzzles are returned.
 * @param username The username to fetch.
 * @returns The user with the given username.
 */
async function fetchUser(username: string) {
    const output = await dynamo.send(
        new GetItemCommand({
            Key: {
                username: { S: username },
            },
            ProjectionExpression: `username, puzzles, ratingSystem, ratings`,
            TableName: userTable,
        }),
    );
    if (!output.Item) {
        throw new ApiError({ statusCode: 404, publicMessage: `User not found` });
    }

    return unmarshall(output.Item) as Pick<
        User,
        'username' | 'puzzles' | 'ratingSystem' | 'ratings'
    >;
}

const SCORE_PER_RESULT = {
    win: 1,
    draw: 0.5,
    loss: 0,
};

/**
 * Updates the ratings of the previous puzzle and the user. Also saves an entry for the user/puzzle
 * in the puzzle results table.
 * @param previousPuzzle The previous puzzle the user took.
 * @param user The user who took the puzzle.
 * @return The updated user object.
 */
async function handlePreviousPuzzle(
    previousPuzzle: Required<NextPuzzleRequest>['previousPuzzle'],
    user: Pick<User, 'username' | 'puzzles' | 'ratingSystem' | 'ratings'>,
) {
    const updatesByTheme: Record<string, PuzzleThemeOverview> = {};
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    const date = new Date().toISOString();
    const session = mongoClient.startSession();
    let puzzle: WithId<Puzzle> | null = null;
    while (attempts < MAX_ATTEMPTS) {
        try {
            puzzle = await session.withTransaction(async () => {
                const collection = mongoClient.db('puzzles').collection<Puzzle>('puzzles');
                const puzzle = await collection.findOne({ _id: previousPuzzle.id });
                if (!puzzle) {
                    console.error(`Failed to fetch previous puzzle with id "${previousPuzzle.id}"`);
                    return puzzle;
                }
                if (!previousPuzzle.rated) {
                    return puzzle;
                }

                for (const theme of ['OVERALL'].concat(puzzle.themes)) {
                    const ranking = new Glicko2({ rating: 1000 });
                    const themeOverview = getPuzzleOverview(user, theme);
                    const userRanking = ranking.makePlayer(
                        themeOverview.rating,
                        themeOverview.ratingDeviation,
                        themeOverview.volatility,
                    );
                    const puzzleRanking = ranking.makePlayer(
                        puzzle.rating,
                        puzzle.ratingDeviation,
                        puzzle.volatility,
                    );
                    ranking.updateRatings([
                        [userRanking, puzzleRanking, SCORE_PER_RESULT[previousPuzzle.result]],
                    ]);

                    updatesByTheme[theme] = {
                        rating: Math.round(userRanking.getRating()),
                        ratingDeviation: userRanking.getRd(),
                        volatility: userRanking.getVol(),
                        plays: (user.puzzles?.[theme]?.plays ?? 0) + 1,
                        lastPlayed: date,
                    };
                    if (theme === 'OVERALL') {
                        const update = {
                            rating: Math.round(puzzleRanking.getRating()),
                            ratingDeviation: puzzleRanking.getRd(),
                            volatility: puzzleRanking.getVol(),
                            plays: (puzzle.plays ?? 0) + 1,
                            successfulPlays:
                                (puzzle.successfulPlays ?? 0) +
                                (previousPuzzle.result === 'win' ? 1 : 0),
                        };
                        console.log(
                            `Updating original puzzle: ${JSON.stringify(puzzle, undefined, 2)} with update: ${JSON.stringify(update, undefined, 2)}`,
                        );

                        await collection.updateOne(
                            { _id: previousPuzzle.id },
                            {
                                $set: update,
                            },
                        );
                    }
                }
                return puzzle;
            });
            break;
        } catch (err) {
            console.error(`Failed transaction to update puzzle: `, err);
            attempts++;
        }
    }
    await session.endSession();

    if (attempts === MAX_ATTEMPTS) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: `Failed to update puzzle in ${MAX_ATTEMPTS} attempts`,
        });
    }

    console.log(
        `Updating original user puzzles: ${JSON.stringify(user.puzzles, undefined, 2)} with update: ${JSON.stringify(updatesByTheme, undefined, 2)}`,
    );
    const input = new UpdateItemBuilder()
        .key('username', user.username)
        .set('puzzles', { ...user.puzzles, ...updatesByTheme })
        .table(userTable)
        .build();
    await dynamo.send(input);

    const history: PuzzleHistory = {
        username: user.username,
        createdAt: date,
        id: previousPuzzle.id,
        fen: puzzle?.fen || '',
        puzzleRating: puzzle?.rating ?? 0,
        result: previousPuzzle.result,
        timeSpentSeconds: previousPuzzle.timeSpentSeconds,
        pgn: previousPuzzle.pgn,
        rated: previousPuzzle.rated,
        rating: updatesByTheme.OVERALL.rating,
        ratingChange: updatesByTheme.OVERALL.rating - getPuzzleOverview(user, 'OVERALL').rating,
    };
    await dynamo.send(
        new PutItemCommand({
            Item: marshall(history, { removeUndefinedValues: true }),
            TableName: puzzleResultsTable,
        }),
    );

    return { ...user, puzzles: { ...user.puzzles, ...updatesByTheme } };
}
