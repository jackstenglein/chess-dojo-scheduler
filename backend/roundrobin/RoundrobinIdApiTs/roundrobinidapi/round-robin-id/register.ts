import { RoundRobinRegisterSchema } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { errToApiGatewayProxyResultV2, parseEvent } from 'chess-dojo-directory-service/api';

export const handler: APIGatewayProxyHandlerV2 = (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, RoundRobinRegisterSchema);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
