import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    AddDirectoryItemRequest,
    AddDirectoryItemSchema,
    Directory,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from './api';
import { attributeExists, directoryTable, dynamo, UpdateItemBuilder } from './database';

/**
 * Handles requests to the add directory item API. Returns the updated directory.
 * @param event The API gateway event that triggered the request.
 * @returns The updated directory after the item is added.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, AddDirectoryItemSchema);
        const directory = await addDirectoryItem(userInfo.username, request);
        return success({ directory });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Adds an item to a directory.
 * @param owner The owner of the directory.
 * @param request The request to add.
 * @returns The updated directory.
 */
async function addDirectoryItem(
    owner: string,
    request: AddDirectoryItemRequest,
): Promise<Directory> {
    try {
        const input = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', request.id)
            .set('updatedAt', new Date().toISOString())
            .set(`items.${request.game.cohort}#${request.game.id}`, request.game)
            .condition(attributeExists('id'))
            .table(directoryTable)
            .return('ALL_NEW')
            .build();

        const result = await dynamo.send(input);
        return unmarshall(result.Attributes!) as Directory;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Directory does not exist, or you do not have permission to update it',
                privateMessage: 'DynamoDB conditional check failure',
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
