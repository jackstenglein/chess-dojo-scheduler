import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
    GameReviewCohort,
    pauseQueueDateRequestSchema,
} from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from '../directoryService/api';
import {
    attributeExists,
    getUser,
    LIVE_CLASSES_TABLE,
    UpdateItemBuilder,
} from '../directoryService/database';

/**
 * Pauses the queue position for a game review cohort member. The caller must
 * be an admin or the member themselves.
 * @param event The event that triggered the request.
 * @returns The updated game review cohort.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, pauseQueueDateRequestSchema);
        const userInfo = requireUserInfo(event);
        if (userInfo.username !== request.username) {
            const user = await getUser(userInfo.username);
            if (!user.isAdmin) {
                throw new ApiError({
                    statusCode: 403,
                    publicMessage: `You must be an admin to perform this action`,
                });
            }
        }

        try {
            const gameReviewCohort = await new UpdateItemBuilder<GameReviewCohort>()
                .key('type', 'GAME_REVIEW_COHORT')
                .key('id', request.id)
                .set(['members', request.username, 'paused'], request.pause)
                .condition(attributeExists(['members', request.username]))
                .return('ALL_NEW')
                .table(LIVE_CLASSES_TABLE)
                .send();
            return success({ gameReviewCohort });
        } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage: `User ${request.username} is not a member of game review cohort ${request.id}`,
                });
            }
            throw new ApiError({
                statusCode: 500,
                publicMessage: 'Temporary server error',
                privateMessage: `DDB UpdateItem failure`,
                cause: err,
            });
        }
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
