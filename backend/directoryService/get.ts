'use strict';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItemTypes,
    DirectorySchema,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { checkAccess, getAccessRole } from './access';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parsePathParameters,
    requireUserInfo,
    success,
} from './api';
import { directoryTable, dynamo } from './database';

export const getDirectorySchema = DirectorySchema.pick({ owner: true, id: true });

/**
 * Handles requests to the get directory API. Returns an error if the directory does
 * not exist or is private and the caller does not have viewer access.
 * @param event The API gateway event that triggered the request.
 * @returns The requested directory.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, getDirectorySchema);
        const directory = await fetchDirectory(request.owner, request.id);

        if (!directory) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: 'Directory not found',
            });
        }

        const accessRole = await getAccessRole({
            owner: directory.owner,
            id: directory.id,
            username: userInfo.username,
            directory,
        });
        const isViewer = compareRoles(DirectoryAccessRole.Viewer, accessRole);
        if (directory.visibility === DirectoryVisibility.PRIVATE && !isViewer) {
            throw new ApiError({
                statusCode: 403,
                publicMessage:
                    'This directory is private. Ask the owner to make it public or share it with you.',
            });
        }

        if (!isViewer) {
            await filterPrivateItems(directory, userInfo.username);
        }

        return success(directory);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

export const handlerV2: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, getDirectorySchema);
        const directory = await fetchDirectory(request.owner, request.id);

        if (!directory) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: 'Directory not found',
            });
        }

        const accessRole = await getAccessRole({
            owner: directory.owner,
            id: directory.id,
            username: userInfo.username,
            directory,
        });
        const isViewer = compareRoles(DirectoryAccessRole.Viewer, accessRole);

        if (directory.visibility === DirectoryVisibility.PRIVATE && !isViewer) {
            throw new ApiError({
                statusCode: 403,
                publicMessage:
                    'This directory is private. Ask the owner to make it public or share it with you.',
            });
        }

        if (!isViewer) {
            await filterPrivateItems(directory, userInfo.username);
        }

        return success({ directory, accessRole });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Fetches the directory with the given owner and id from DynamoDB.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @returns The given directory, or undefined if it does not exist.
 */
export async function fetchDirectory(
    owner: string,
    id: string,
): Promise<Directory | undefined> {
    const getItemOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                owner: { S: owner },
                id: { S: id },
            },
            TableName: directoryTable,
        }),
    );
    if (!getItemOutput.Item) {
        return undefined;
    }

    const directory = unmarshall(getItemOutput.Item);
    return DirectorySchema.parse(directory);
}

/**
 * Removes subdirectories that the given viewer should not be able to see
 * from the itemIds and items field of the provided directory. The directory
 * is updated in place.
 * @param directory The directory to remove private subdirectories from.
 * @param viewer The username of the person viewing the directory.
 */
async function filterPrivateItems(directory: Directory, viewer: string) {
    let i = 0;
    let j = 0;

    while (i < directory.itemIds.length) {
        const id = directory.itemIds[i];
        if (
            directory.items[id]?.type !== DirectoryItemTypes.DIRECTORY ||
            directory.items[id].metadata.visibility === DirectoryVisibility.PUBLIC ||
            (await checkAccess({
                owner: directory.owner,
                id,
                role: DirectoryAccessRole.Viewer,
                skipRecursion: true,
                username: viewer,
            }))
        ) {
            directory.itemIds[j++] = id;
        } else if (directory.items[id]) {
            delete directory.items[id];
        }
        i++;
    }
    directory.itemIds.length = j;
}
