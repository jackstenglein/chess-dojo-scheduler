import {
    GameReviewCohort,
    getGameReviewCohortRequestSchema,
} from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    success,
} from '../directoryService/api';
import { GetItemBuilder, LIVE_CLASSES_TABLE } from '../directoryService/database';

/**
 * Returns the game review cohort with the given id.
 * @param event The event that triggered the request.
 * @returns The game review cohort with the given id.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, getGameReviewCohortRequestSchema);
        const gameReviewCohort = await new GetItemBuilder<GameReviewCohort>()
            .key('type', 'GAME_REVIEW_COHORT')
            .key('id', request.id)
            .table(LIVE_CLASSES_TABLE)
            .send();
        if (!gameReviewCohort) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: `No game review cohort found with id: ${request.id}`,
            });
        }
        return success({ gameReviewCohort });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
