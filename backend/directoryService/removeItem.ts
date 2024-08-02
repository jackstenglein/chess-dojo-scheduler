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

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, RemoveDirectoryItemSchema);
        const directory = await removeDirectoryItem(
            userInfo.username,
            request.directoryId,
            request.itemId,
        );
        return success({ directory });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Removes the specified item from the specified directory.
 * @param owner The owner of the directory.
 * @param directoryId The id of the directory to remove the item from.
 * @param itemId The id of the item to remove from the directory.
 * @param allowSubdirectory Whether to allow removing subdirectories.
 * @returns The updated directory.
 */
export async function removeDirectoryItem(
    owner: string,
    directoryId: string,
    itemId: string,
    allowSubdirectory?: boolean,
): Promise<Directory> {
    try {
        const input = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', directoryId)
            .remove(`items.${itemId}`)
            .set('updatedAt', new Date().toISOString())
            .condition(
                allowSubdirectory
                    ? attributeExists('id')
                    : and(
                          attributeExists('id'),
                          notEqual(`items.${itemId}.type`, DirectoryItemTypes.DIRECTORY),
                      ),
            )
            .table(directoryTable)
            .return('ALL_NEW')
            .build();

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
