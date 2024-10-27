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

/**
 * Handles requests to the share directory API. Returns the updated directory.
 * @param event The API gateway event that triggered the request.
 * @returns The updated directory after the access is changed.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, ShareDirectorySchema);

        const hasAccess = await checkAccess({
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

        const directory = await shareDirectory(request);
        return success(directory);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Sets the access on the given directory.
 * @param request The owner, id and new access of the directory.
 * @returns The updated directory.
 */
async function shareDirectory(request: ShareDirectoryRequest) {
    const input = new UpdateItemBuilder()
        .key('owner', request.owner)
        .key('id', request.id)
        .set('updatedAt', new Date().toISOString())
        .set('access', request.access)
        .condition(attributeExists('id'))
        .table(directoryTable)
        .return('ALL_NEW')
        .build();

    console.log('Input: %j', input);
    const result = await dynamo.send(input);
    const directory = unmarshall(result.Attributes!) as Directory;
    return directory;
}
