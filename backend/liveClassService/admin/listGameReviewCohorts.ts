import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    requireUserInfo,
    success,
} from '../../directoryService/api';
import { dynamo, getUser, LIVE_CLASSES_TABLE } from '../../directoryService/database';

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
        return success({ gameReviewCohorts });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
