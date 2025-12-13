import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    getSubscriptionTier,
    SubscriptionTier,
    User,
} from '@jackstenglein/chess-dojo-common/src/database/user';
import { getRecordingRequestSchema } from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from '../directoryService/api';
import { dynamo } from '../directoryService/database';

const USERS_TABLE = `${process.env.stage}-users`;
const S3_CLIENT = new S3Client({ region: 'us-east-1' });
const S3_BUCKET = process.env.s3Bucket;

/**
 * Generates and returns an S3 presigned URL to download a live class
 * recording.
 * @param event
 * @returns
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, getRecordingRequestSchema);
        const user = await getUser(userInfo.username);
        const subscriptionTier = getSubscriptionTier(user);

        if (
            request.s3Key.startsWith(SubscriptionTier.GameReview) &&
            subscriptionTier !== SubscriptionTier.GameReview
        ) {
            throw new ApiError({
                statusCode: 403,
                publicMessage: `You must be a subscriber on the Game & Profile Review tier to download this recording`,
            });
        }
        if (
            subscriptionTier !== SubscriptionTier.GameReview &&
            subscriptionTier !== SubscriptionTier.Lecture
        ) {
            throw new ApiError({
                statusCode: 403,
                publicMessage: `You must be a subscriber on the Group Classes tier or higher to download this recording`,
            });
        }

        const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: request.s3Key });
        const url = await getSignedUrl(S3_CLIENT, command, { expiresIn: 86400 });
        return success({ url });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function getUser(username: string): Promise<User> {
    const output = await dynamo.send(
        new GetItemCommand({
            Key: { username: { S: username } },
            TableName: USERS_TABLE,
        }),
    );
    if (!output.Item) {
        throw new ApiError({ statusCode: 404, publicMessage: `User ${username} not found` });
    }
    return unmarshall(output.Item) as User;
}
