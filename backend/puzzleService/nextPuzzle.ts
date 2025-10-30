import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { User } from '@jackstenglein/chess-dojo-common/src/database/user';
import { nextPuzzleRequestSchema } from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { MongoClient, ServerApiVersion } from 'mongodb';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from '../directoryService/api';
import { dynamo } from '../directoryService/database';

const userTable = `${process.env.stage}-users`;

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
        const user = await fetchUser(userInfo.username);

        let rating = user.puzzles?.OVERALL.rating ?? user.ratings[user.ratingSystem]?.currentRating;
        if (!rating) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `User has no puzzle rating or current rating in their preferred rating system`,
            });
        }

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
        console.log(`Got document from mongo: `, document);
        return success({
            puzzle: { plays: 0, successfulPlays: 0, id: document?._id, ...document },
            rating,
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
            ProjectionExpression: `puzzles, ratingSystem, ratings`,
            TableName: userTable,
        }),
    );
    if (!output.Item) {
        throw new ApiError({ statusCode: 404, publicMessage: `User not found` });
    }

    return unmarshall(output.Item) as Pick<User, 'puzzles' | 'ratingSystem' | 'ratings'>;
}
