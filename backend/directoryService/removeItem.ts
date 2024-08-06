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
    parsePathParameters,
    requireUserInfo,
    success,
} from './api';
import {
    and,
    attributeExists,
    directoryTable,
    dynamo,
    notEqual,
    UpdateItemBuilder,
} from './database';

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
        const request = parsePathParameters(event, RemoveDirectoryItemSchema);
        const directory = await removeDirectoryItems(
            userInfo.username,
            request.directoryId,
            [request.itemId],
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
 * @param allowSubdirectory Whether to allow removing subdirectories.
 * @returns The updated directory.
 */
export async function removeDirectoryItems(
    owner: string,
    directoryId: string,
    items: string[],
    allowSubdirectory?: boolean,
): Promise<Directory> {
    try {
        const conditions = [attributeExists('id')];
        const builder = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', directoryId)
            .set('updatedAt', new Date().toISOString())
            .table(directoryTable)
            .return('ALL_NEW');

        for (const id of items) {
            builder.remove(['items', id]);
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
