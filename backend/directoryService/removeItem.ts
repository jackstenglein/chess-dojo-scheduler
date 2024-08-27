import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    DirectoryItemTypes,
    RemoveDirectoryItemSchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from './api';
import {
    and,
    attributeExists,
    directoryTable,
    dynamo,
    equal,
    notEqual,
    UpdateItemBuilder,
} from './database';
import { fetchDirectory } from './get';
import { getItemIndexMap } from './moveItems';

/**
 * Handles requests to the remove directory item API. Returns the updated
 * directory. Cannot be used to remove a subdirectory. Use the delete directory API
 * instead.
 * @param event The API gateway event that triggered the request.
 * @returns The updated directory after the item is removed.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, RemoveDirectoryItemSchema);
        const directory = await removeDirectoryItems(
            userInfo.username,
            request.directoryId,
            [request.itemId],
            { [request.itemId]: request.itemIndex },
        );
        return success({ directory });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Removes the specified items from the specified directory.
 * @param owner The owner of the directory.
 * @param directoryId The id of the directory to remove the items from.
 * @param items The ids of the items to remove from the directory.
 * @param itemIndices A map from item id to the index in the parent directory's itemIds field.
 * @param allowSubdirectory Whether to allow removing subdirectories.
 * @returns The updated directory.
 */
export async function removeDirectoryItems(
    owner: string,
    directoryId: string,
    items: string[],
    itemIndices?: Record<string, number>,
    allowSubdirectory?: boolean,
): Promise<Directory> {
    try {
        if (!itemIndices) {
            const directory = await fetchDirectory(owner, directoryId);
            if (!directory) {
                throw new ApiError({
                    statusCode: 400,
                    publicMessage: 'Directory not found',
                    privateMessage: `Directory ${owner}/${directoryId} does not exist`,
                });
            }
            itemIndices = getItemIndexMap(directory.itemIds);
        }

        const conditions = [attributeExists('id')];
        const builder = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', directoryId)
            .set('updatedAt', new Date().toISOString())
            .table(directoryTable)
            .return('ALL_NEW');

        for (const id of items) {
            builder.remove(['items', id]);
            builder.remove(['itemIds', itemIndices[id]]);
            conditions.push(equal(['itemIds', itemIndices[id]], id));

            if (!allowSubdirectory) {
                conditions.push(
                    notEqual(['items', id, 'type'], DirectoryItemTypes.DIRECTORY),
                );
            }
        }
        builder.condition(allowSubdirectory ? conditions[0] : and(...conditions));

        const input = builder.build();
        console.log('Input: %j', input);
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
