import {
    BatchExecuteStatementCommand,
    BatchStatementRequest,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    DirectoryItem,
    DirectoryItemSubdirectory,
    DirectoryItemTypes,
    MoveDirectoryItemsRequest,
    MoveDirectoryItemsSchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { addDirectoryItems } from './addItems';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseBody,
    requireUserInfo,
    success,
} from './api';
import { directoryTable, dynamo } from './database';
import { fetchDirectory } from './get';
import { removeDirectoryItems } from './removeItems';

/**
 * Handles requests to the move directory items API. Returns the updated
 * source/target directories.
 * @param event The API gateway event that triggered the request.
 * @returns The updated source/target directories after the move is complete.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseBody(event, MoveDirectoryItemsSchema);
        const resp = await moveItems(userInfo.username, request);
        return success(resp);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Moves items between two directories. The items are first added to the
 * target directory and then removed from the source directory. This ensures
 * that the items are never accidentally deleted, although it does permit the
 * possibility that the items get added to the target without being removed
 * from the source.
 * @param owner The owner of the directories.
 * @param request The MoveDirectoryItemsRequest.
 * @returns The updated source/target directories after the move is complete.
 */
async function moveItems(
    owner: string,
    request: MoveDirectoryItemsRequest,
): Promise<{ source: Directory; target: Directory }> {
    let source = await fetchDirectory(owner, request.source);
    if (!source) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'source directory does not exist',
        });
    }
    const itemOrderMap = getItemIndexMap(source.itemIds);

    const items = request.items
        .map((id) => source?.items[id])
        .filter((item) => Boolean(item)) as DirectoryItem[];
    items.sort((lhs, rhs) => (itemOrderMap[lhs.id] ?? 0) - (itemOrderMap[rhs.id] ?? 0));

    const target = await addDirectoryItems(owner, request.target, items);
    await updateParent(
        owner,
        target.id,
        items.filter((i) => i.type === DirectoryItemTypes.DIRECTORY),
    );

    source = await removeDirectoryItems(
        owner,
        source.id,
        request.items,
        itemOrderMap,
        true,
    );
    return { source, target };
}

/**
 * Converts a list of item ids in order to a map from item id to index.
 * @param itemIds The list of ids in order.
 * @returns A map from item id to index.
 */
export function getItemIndexMap(itemIds: string[]) {
    return itemIds.reduce<Record<string, number>>((acc, id, index) => {
        acc[id] = index;
        return acc;
    }, {});
}

/**
 * Updates the parent of the directories corresponding to the given list of subdirectory items.
 * @param owner The owner of the directories.
 * @param parent The new parent id to set on the directories.
 * @param items The subdirectory items corresponding to the directories to update.
 */
async function updateParent(
    owner: string,
    parent: string,
    items: DirectoryItemSubdirectory[],
) {
    for (let i = 0; i < items.length; i += 25) {
        const statements: BatchStatementRequest[] = [];

        for (let j = i; j < items.length && j < i + 25; j++) {
            const item = items[j];
            const params = marshall([parent, owner, item.id]);
            statements.push({
                Statement: `UPDATE "${directoryTable}" SET parent=? WHERE owner=? AND id=?`,
                Parameters: params,
            });
        }

        console.log('Sending BatchExecuteStatements: ', statements);
        const input = new BatchExecuteStatementCommand({ Statements: statements });
        const result = await dynamo.send(input);
        console.log('BatchExecuteResult: %j', result);
    }
}
