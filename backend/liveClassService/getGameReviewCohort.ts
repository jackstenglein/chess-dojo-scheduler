import { Event } from '@jackstenglein/chess-dojo-common/src/database/event';
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

const EVENTS_TABLE = `${process.env.stage}-events`;

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

        if (gameReviewCohort.senseiReviewEventId) {
            gameReviewCohort.senseiReviewEvent = await new GetItemBuilder<Event>()
                .key('id', gameReviewCohort.senseiReviewEventId)
                .table(EVENTS_TABLE)
                .send();
        }

        if (gameReviewCohort.peerReviewEventId) {
            gameReviewCohort.peerReviewEvent = await new GetItemBuilder<Event>()
                .key('id', gameReviewCohort.peerReviewEventId)
                .table(EVENTS_TABLE)
                .send();
        }

        return success({ gameReviewCohort });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
