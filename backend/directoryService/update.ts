import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    isDefaultDirectory,
    UpdateDirectoryRequest,
    UpdateDirectorySchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseBody,
    requireUserInfo,
    success,
} from './api';
import { attributeExists, directoryTable, dynamo, UpdateItemBuilder } from './database';

/**
 * Handles requests to the update directory API, which allows updating the name and
 * visibility of a directory. Returns an error if the caller is not the owner of the
 * directory, or if the directory is a default directory. The updated directory is
 * returned.
 * @param event The API gateway event triggering the request.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parseBody(event, UpdateDirectorySchema);

        if (isDefaultDirectory(request.id)) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'This directory cannot be updated',
                privateMessage: `Request is for default directory ${request.id}`,
            });
        }

        if (!request.name && !request.visibility) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'At least one of `name` and `visibility` is required',
            });
        }

        const result = await updateDirectory(userInfo.username, request);
        return success(result);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Updates the given directory. Fails if the directory does not already exist.
 * @param owner The owner of the directory.
 * @param request The update request.
 * @returns The updated directory.
 */
async function updateDirectory(
    owner: string,
    request: UpdateDirectoryRequest,
): Promise<{ directory: Directory; parent: Directory }> {
    try {
        let input = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', request.id)
            .set('name', request.name)
            .set('visibility', request.visibility)
            .set('updatedAt', new Date().toISOString())
            .condition(attributeExists('id'))
            .table(directoryTable)
            .return('ALL_NEW')
            .build();

        console.log('Sending update item: %j', input);
        let result = await dynamo.send(input);
        const directory = unmarshall(result.Attributes!) as Directory;

        input = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', directory.parent)
            .set(`items.${directory.id}.metadata.name`, directory.name)
            .set(`items.${directory.id}.metadata.visibility`, directory.visibility)
            .set(`items.${directory.id}.metadata.updatedAt`, directory.updatedAt)
            .condition(attributeExists(`items.${directory.id}`))
            .table(directoryTable)
            .return('ALL_NEW')
            .build();

        console.log('Sending parent update: %j', input);
        result = await dynamo.send(input);
        const parent = unmarshall(result.Attributes!) as Directory;

        return {
            directory,
            parent,
        };
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: directory not found or you do not have permission to update it',
                privateMessage: 'DDB conditional check failed: attribute_exists(id)',
                cause: err,
            });
        }
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: 'DDB UpdateItem failure',
            cause: err,
        });
    }
}
