import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { errToApiGatewayProxyResultV2 } from 'chess-dojo-directory-service/api';

export const handler: APIGatewayProxyHandlerV2 = (event) => {
    try {
        console.log('Event: ', event);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
