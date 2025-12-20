import { AttributeValue, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { SubscriptionTier, User } from '@jackstenglein/chess-dojo-common/src/database/user';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    requireUserInfo,
    success,
} from '../../directoryService/api';
import { dynamo, getUser, LIVE_CLASSES_TABLE, USER_TABLE } from '../../directoryService/database';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const userInfo = requireUserInfo(event);
        const user = await getUser(userInfo.username);
        if (!user.isAdmin) {
            throw new ApiError({
                statusCode: 403,
                publicMessage: `You must be an admin to perform this action`,
            });
        }

        const output = await dynamo.send(
            new ScanCommand({
                TableName: LIVE_CLASSES_TABLE,
            }),
        );

        const gameReviewCohorts = output.Items?.map((item) => unmarshall(item)) ?? [];
        const users = await getGameReviewUsers();
        const unassignedUsers = users.filter(
            (u) => !gameReviewCohorts.some((grc) => grc.members[u.username]),
        );

        return success({ gameReviewCohorts, unassignedUsers });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function getGameReviewUsers() {
    let exclusiveStartKey: Record<string, AttributeValue> | undefined = undefined;
    const users: User[] = [];

    do {
        const input = new QueryCommand({
            KeyConditionExpression: '#subscriptionTier = :gameReview',
            ExpressionAttributeNames: { '#subscriptionTier': 'subscriptionTier' },
            ExpressionAttributeValues: { ':gameReview': { S: SubscriptionTier.GameReview } },
            IndexName: `SubscriptionTierIdx`,
            TableName: USER_TABLE,
        });

        const output = await dynamo.send(input);
        users.push(...(output.Items?.map((u) => unmarshall(u) as User) ?? []));
        exclusiveStartKey = output.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return users;
}
