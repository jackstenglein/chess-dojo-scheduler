import {
    BatchExecuteStatementCommand,
    BatchStatementRequest,
    ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    AddDirectoryItemRequest,
    AddDirectoryItemSchema,
    Directory,
    DirectoryItem,
    DirectoryItemType,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
    UserInfo,
} from './api';
import {
    and,
    attributeExists,
    attributeNotExists,
    directoryTable,
    dynamo,
    gameTable,
    UpdateItemBuilder,
} from './database';

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
        const item = getDirectoryItem(userInfo, request);
        const directory = await addDirectoryItems(userInfo.username, request.id, [item]);

        return success({ directory });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Converts the given AddDirectoryItemRequest into the DirectoryItem to add.
 * @param userInfo The info of the calling user.
 * @param request The request to convert.
 * @returns The converted DirectoryItem.
 */
function getDirectoryItem(
    userInfo: UserInfo,
    request: AddDirectoryItemRequest,
): DirectoryItem {
    let type: DirectoryItemType;
    if (request.game.owner === userInfo.username) {
        type = DirectoryItemTypes.OWNED_GAME;
    } else if (request.game.cohort === 'masters') {
        type = DirectoryItemTypes.MASTER_GAME;
    } else {
        type = DirectoryItemTypes.DOJO_GAME;
    }

    return {
        type,
        id: `${request.game.cohort}/${request.game.id}`,
        metadata: request.game,
    };
}

/**
 * Adds items to a directory.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @param items The items to add.
 * @returns The updated directory.
 */
export async function addDirectoryItems(
    owner: string,
    id: string,
    items: DirectoryItem[],
): Promise<Directory> {
    try {
        const conditions = [];
        const builder = new UpdateItemBuilder()
            .key('owner', owner)
            .key('id', id)
            .set('updatedAt', new Date().toISOString())
            .condition(attributeExists('id'))
            .table(directoryTable)
            .return('ALL_NEW');
        for (const item of items) {
            builder.set(['items', item.id], item);
            conditions.push(attributeNotExists(['items', item.id]));
        }
        builder.condition(and(...conditions));
        builder.appendToList(
            'itemIds',
            items.map((item) => item.id),
        );

        const input = builder.build();
        console.log('Input: %j', input);
        const result = await dynamo.send(input);
        const directory = unmarshall(result.Attributes!) as Directory;

        await addDirectoryToGames(owner, id, items);

        return directory;
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

/**
 * Adds the given directory to the Games represented by the game items in the given DirectoryItem list.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @param items The items to add the directory to. Only items representing games are affected.
 */
export async function addDirectoryToGames(
    owner: string,
    id: string,
    items: DirectoryItem[],
) {
    const gameItems = items.filter((item) => item.type !== DirectoryItemTypes.DIRECTORY);
    console.log('Game items: %j', gameItems);

    for (let i = 0; i < gameItems.length; i += 25) {
        const statements: BatchStatementRequest[] = [];

        for (let j = i; j < gameItems.length && j < i + 25; j++) {
            const item = gameItems[j];
            const params = marshall([item.metadata.cohort, item.metadata.id]);
            statements.push({
                Statement: `UPDATE "${gameTable}" SET directories=set_add(directories, <<'${owner}/${id}'>>) WHERE cohort=? AND id=?`,
                Parameters: params,
            });
        }

        console.log('Sending BatchExecuteStatements: %j', statements);
        const input = new BatchExecuteStatementCommand({ Statements: statements });
        const result = await dynamo.send(input);
        console.log('BatchExecuteResult: %j', result);
    }
}
