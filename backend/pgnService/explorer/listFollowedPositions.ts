import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    requireUserInfo,
    success,
} from 'chess-dojo-directory-service/api';
import { dynamo } from 'chess-dojo-directory-service/database';
import { explorerTable } from './listGames';

const followerIndex = 'FollowerIdx';

/**
 * Returns a list of positions the caller has followed.
 * @param event The API Gateway event that generated the request.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    console.log('Event: %j', event);

    try {
        const userInfo = requireUserInfo(event);
        const startKey = event.queryStringParameters?.startKey;

        const output = await dynamo.send(
            new QueryCommand({
                KeyConditionExpression: `#follower = :follower`,
                ExpressionAttributeNames: {
                    '#follower': 'follower',
                },
                ExpressionAttributeValues: {
                    ':follower': { S: userInfo.username },
                },
                ExclusiveStartKey: startKey ? JSON.parse(startKey) : undefined,
                TableName: explorerTable,
                IndexName: followerIndex,
            }),
        );

        const positions = output.Items?.map((item) => unmarshall(item));
        const lastEvaluatedKey = JSON.stringify(output.LastEvaluatedKey);

        return success({
            positions,
            lastEvaluatedKey,
        });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
