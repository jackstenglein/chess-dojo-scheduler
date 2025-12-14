import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { getGameReviewCohortRequestSchema } from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    success,
} from '../directoryService/api';
import { dynamo } from '../directoryService/database';

const liveClassesTable = `${process.env.stage}-live-classes`;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, getGameReviewCohortRequestSchema);
        const output = await dynamo.send(
            new GetItemCommand({
                Key: { type: { S: 'GAME_REVIEW_COHORT' }, id: { S: request.id } },
                TableName: liveClassesTable,
            }),
        );
        if (!output.Item) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: `No game review cohort found with id: ${request.id}`,
            });
        }
        return success({ gameReviewCohort: unmarshall(output.Item) });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
