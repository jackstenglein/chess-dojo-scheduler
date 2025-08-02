import { BatchExecuteStatementCommand, BatchStatementRequest } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItem,
    DirectoryItemSubdirectory,
    DirectoryItemTypes,
    MoveDirectoryItemsRequestV2,
    MoveDirectoryItemsSchemaV2,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { checkAccess, getAccessRole } from './access';
import { addDirectoryItems } from './addItems';
import { ApiError, errToApiGatewayProxyResultV2, parseBody, requireUserInfo, success } from './api';
import { directoryTable, dynamo } from './database';
import { fetchDirectory } from './get';
import { removeDirectoryItems } from './removeItems';

/**
 * Handles requests to the move directory items API. Returns the updated
 * source/target directories.
 * @param event The API gateway event that triggered the request.
 * @returns The updated source/target directories after the move is complete.
 */
export const handlerV2: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const request = parseBody(event, MoveDirectoryItemsSchemaV2);
        const resp = await moveItems(event, request);
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
    event: APIGatewayProxyEventV2,
    request: MoveDirectoryItemsRequestV2,
): Promise<{ source: Directory; target: Directory }> {
    const userInfo = requireUserInfo(event);

    let source = await fetchDirectory(request.source.owner, request.source.id);
    if (!source) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'source directory does not exist',
        });
    }

    const sourceAccess = await getAccessRole({
        owner: request.source.owner,
        id: request.source.id,
        username: userInfo.username,
        directory: source,
    });
    if (!compareRoles(DirectoryAccessRole.Editor, sourceAccess)) {
        throw new ApiError({
            statusCode: 403,
            publicMessage: `Missing required Editor permissions to move items from source directory`,
        });
    }
    if (sourceAccess === DirectoryAccessRole.Editor) {
        for (const id of request.items) {
            if (source.items[id].addedBy !== userInfo.username) {
                throw new ApiError({
                    statusCode: 403,
                    publicMessage: `Missing required Admin/Owner permissions to move item added by another user (id ${id})`,
                });
            }
        }
    }

    if (
        !(await checkAccess({
            owner: request.target.owner,
            id: request.target.id,
            username: userInfo.username,
            role: DirectoryAccessRole.Editor,
        }))
    ) {
        throw new ApiError({
            statusCode: 403,
            publicMessage: `Missing required Editor permissions to add items to target directory`,
        });
    }

    const itemOrderMap = getItemIndexMap(source.itemIds);
    const items = request.items
        .map((id) => source?.items[id])
        .filter((item) => Boolean(item)) as DirectoryItem[];
    items.forEach((item) => {
        item.addedBy = userInfo.username;
    });
    items.sort((lhs, rhs) => (itemOrderMap[lhs.id] ?? 0) - (itemOrderMap[rhs.id] ?? 0));

    const target = await addDirectoryItems(request.target.owner, request.target.id, items);
    await updateParent(
        target.owner,
        target.id,
        items.filter((i) => i.type === DirectoryItemTypes.DIRECTORY),
    );

    source = await removeDirectoryItems(source.owner, source.id, request.items, true);
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
async function updateParent(owner: string, parent: string, items: DirectoryItemSubdirectory[]) {
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
