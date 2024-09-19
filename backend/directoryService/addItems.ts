import {
    BatchExecuteStatementCommand,
    BatchStatementRequest,
    ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    AddDirectoryItemsRequest,
    AddDirectoryItemsSchema,
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
    attributeExists,
    directoryTable,
    dynamo,
    gameTable,
    UpdateItemBuilder,
} from './database';

const ADD_ITEMS_BATCH_SIZE = 200;
const MAX_BATCHES = 5;

/**
 * Handles requests to the add directory items API. Returns the updated directory.
 * @param event The API gateway event that triggered the request.
 * @returns The updated directory after the items are added.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, AddDirectoryItemsSchema);
        const items = getDirectoryItems(userInfo, request);
        if (items.length === 0) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Invalid request: at least one item is required',
            });
        }
        if (items.length > ADD_ITEMS_BATCH_SIZE * MAX_BATCHES) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `Invalid request: number of items (${items.length}) is greater than max batch size ${ADD_ITEMS_BATCH_SIZE * MAX_BATCHES}`,
            });
        }

        const directory = await addDirectoryItems(userInfo.username, request.id, items);
        return success({ directory });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Converts the given AddDirectoryItemsRequest into an array of DirectoryItems to add.
 * @param userInfo The info of the calling user.
 * @param request The request to convert.
 * @returns An array of the converted DirectoryItems.
 */
function getDirectoryItems(
    userInfo: UserInfo,
    request: AddDirectoryItemsRequest,
): DirectoryItem[] {
    const result: DirectoryItem[] = [];

    for (const game of request.games) {
        let type: DirectoryItemType;
        if (game.owner === userInfo.username) {
            type = DirectoryItemTypes.OWNED_GAME;
        } else if (game.cohort === 'masters') {
            type = DirectoryItemTypes.MASTER_GAME;
        } else {
            type = DirectoryItemTypes.DOJO_GAME;
        }

        result.push({
            type,
            id: `${game.cohort}/${game.id}`,
            metadata: game,
        });
    }

    return result;
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
        let directory: Directory | undefined = undefined;

        for (let i = 0; i < items.length; i += ADD_ITEMS_BATCH_SIZE) {
            const builder = new UpdateItemBuilder()
                .key('owner', owner)
                .key('id', id)
                .set('updatedAt', new Date().toISOString())
                .condition(attributeExists('id'))
                .table(directoryTable)
                .return('ALL_NEW');

            const currentItems = items.slice(i, i + ADD_ITEMS_BATCH_SIZE);

            for (const item of currentItems) {
                builder.set(['items', item.id], item);
            }

            builder.appendToList(
                'itemIds',
                currentItems.map((item) => item.id),
            );

            const input = builder.build();
            console.log('Input: %j', input);
            const result = await dynamo.send(input);
            directory = unmarshall(result.Attributes!) as Directory;
            await addDirectoryToGames(owner, id, items);
        }

        if (!directory) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Invalid request: at least one item is required',
            });
        }
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
