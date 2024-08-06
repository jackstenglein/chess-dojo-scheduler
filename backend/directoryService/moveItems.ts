import {
    Directory,
    DirectoryItem,
    MoveDirectoryItemsRequest,
    MoveDirectoryItemsSchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { addDirectoryItems } from './addItem';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseBody,
    requireUserInfo,
    success,
} from './api';
import { fetchDirectory } from './get';
import { removeDirectoryItems } from './removeItem';

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

    const items = request.items
        .map((id) => source?.items[id])
        .filter((item) => Boolean(item)) as DirectoryItem[];
    const target = await addDirectoryItems(owner, request.target, items);
    source = await removeDirectoryItems(owner, source.id, request.items, true);
    return { source, target };
}
