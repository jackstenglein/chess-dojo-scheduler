import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    DirectoryAccessRole,
    ShareDirectoryRequest,
    ShareDirectorySchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { checkAccess } from './access';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from './api';
import { attributeExists, directoryTable, dynamo, UpdateItemBuilder } from './database';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, ShareDirectorySchema);

        const hasAccess = checkAccess({
            owner: request.owner,
            id: request.id,
            username: userInfo.username,
            role: DirectoryAccessRole.Admin,
        });
        if (!hasAccess) {
            throw new ApiError({
                statusCode: 403,
                publicMessage: `Missing required admin permissions on the directory (or it does not exist)`,
            });
        }

        await shareDirectory(request);
        return success(null);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

async function shareDirectory(request: ShareDirectoryRequest) {
    const input = new UpdateItemBuilder()
        .key('owner', request.owner)
        .key('id', request.id)
        .set('updatedAt', new Date().toISOString())
        .set('access', request.access)
        .condition(attributeExists('id'))
        .table(directoryTable)
        .return('ALL_OLD')
        .build();

    console.log('Input: %j', input);
    const result = await dynamo.send(input);
    const directory = unmarshall(result.Attributes!) as Directory;
    return directory;
}
