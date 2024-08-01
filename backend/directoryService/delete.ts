import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    DeleteDirectorySchema,
    Directory,
    DirectorySchema,
    isDefaultDirectory,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parsePathParameters,
    requireUserInfo,
    success,
} from './api';
import { attributeExists, directoryTable, dynamo, UpdateItemBuilder } from './database';

/**
 * Handles requests to the delete directory API. Returns the directory as
 * it was before the delete. If the directory did not exist, returns undefined.
 * Note that only the specified directory is deleted. Subdirectories are deleted
 * asynchronously by the recursiveDelete stream handler.
 * @param event The API gateway event that triggered the request.
 * @returns The directory before the delete, or undefined if it did not exist.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, DeleteDirectorySchema);

        if (isDefaultDirectory(request.id)) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'This directory cannot be deleted',
                privateMessage: `Request is for default directory ${request.id}`,
            });
        }

        let parent: Directory | undefined = undefined;
        const directory = await deleteDirectory(userInfo.username, request.id);
        if (directory) {
            parent = await removeDirectoryItem(
                userInfo.username,
                directory.parent,
                request.id,
            );
        }

        return success({ directory, parent });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Deletes the specified directory from DynamoDB. Subdirectories are not deleted
 * and must be explicitly deleted separately.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @returns The directory object as it was before deletion.
 */
export async function deleteDirectory(
    owner: string,
    id: string,
): Promise<Directory | undefined> {
    const output = await dynamo.send(
        new DeleteItemCommand({
            Key: {
                owner: { S: owner },
                id: { S: id },
            },
            TableName: directoryTable,
            ReturnValues: 'ALL_OLD',
        }),
    );
    if (!output.Attributes) {
        return undefined;
    }

    const directory = unmarshall(output.Attributes);
    return DirectorySchema.parse(directory);
}

/**
 * Removes the specified item from the specified directory.
 * @param owner The owner of the directory.
 * @param directoryId The id of the directory to remove the item from.
 * @param itemId The id of the item to remove from the directory.
 * @returns The updated directory.
 */
export async function removeDirectoryItem(
    owner: string,
    directoryId: string,
    itemId: string,
): Promise<Directory> {
    try {
        const input = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', directoryId)
            .remove(`items.${itemId}`)
            .set('updatedAt', new Date().toISOString())
            .condition(attributeExists('id'))
            .table(directoryTable)
            .return('ALL_NEW')
            .build();

        const result = await dynamo.send(input);
        return unmarshall(result.Attributes!) as Directory;
    } catch (err) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: 'DDB UpdateItem failure',
            cause: err,
        });
    }
}
