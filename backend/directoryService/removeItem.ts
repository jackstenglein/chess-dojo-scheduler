import {
    BatchExecuteStatementCommand,
    BatchStatementRequest,
    ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
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
    gameTable,
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
        await removeDirectoryFromGames(owner, directoryId, items);
        return unmarshall(result.Attributes!) as Directory;
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: directory has been changed already or you do not have permission to update it',
                privateMessage: 'DDB conditional check failed',
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

/**
 * Removes the given directory from the Games represented by the given DirectoryItem list.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @param items The items to remove the directory from.
 */
export async function removeDirectoryFromGames(
    owner: string,
    id: string,
    items: string[],
) {
    const gameItems = items.filter((item) => item.includes('/'));

    for (let i = 0; i < gameItems.length; i += 25) {
        const statements: BatchStatementRequest[] = [];

        for (let j = i; j < gameItems.length && j < i + 25; j++) {
            const tokens = gameItems[j].split('/');
            const cohort = tokens[0];
            const gameId = tokens[1];
            if (!cohort || !gameId) {
                continue;
            }

            const params = marshall([cohort, gameId]);
            statements.push({
                Statement: `UPDATE "${gameTable}" SET directories=set_delete(directories, <<'${owner}/${id}'>>) WHERE cohort=? AND id=?`,
                Parameters: params,
            });
        }

        if (statements.length === 0) {
            continue;
        }

        console.log('Sending BatchExecuteStatements: %j', statements);
        const input = new BatchExecuteStatementCommand({ Statements: statements });
        const result = await dynamo.send(input);
        console.log('BatchExecuteResult: %j', result);
    }
}
