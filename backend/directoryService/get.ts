'use strict';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    ALL_MY_UPLOADS_DIRECTORY_ID,
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItemTypes,
    DirectorySchema,
    DirectoryVisibility,
    HOME_DIRECTORY_ID,
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
import { createHomeDirectory } from './create';
import { directoryTable, dynamo } from './database';

export const getDirectorySchema = DirectorySchema.pick({ owner: true, id: true });

/**
 * Handles requests to the get directory API. Returns an error if the directory does
 * not exist or is private and the caller does not have viewer access.
 * @param event The API gateway event that triggered the request.
 * @returns The requested directory.
 */
export const handlerV2: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, getDirectorySchema);
        let directory = await fetchDirectory(request.owner, request.id);

        if (!directory) {
            if (userInfo.username === request.owner && request.id === HOME_DIRECTORY_ID) {
                directory = await createHomeDirectory(userInfo.username);
            } else {
                throw new ApiError({
                    statusCode: 404,
                    publicMessage: 'Directory not found',
                });
            }
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

        addAllUploads(directory);
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
export async function fetchDirectory(owner: string, id: string): Promise<Directory | undefined> {
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
        const item = directory.items[id];
        if (
            (item?.type === DirectoryItemTypes.DIRECTORY &&
                item.metadata.visibility === DirectoryVisibility.PUBLIC) ||
            (item?.type !== DirectoryItemTypes.DIRECTORY && !item.metadata.unlisted) ||
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

/**
 * Adds a fake subdirectory named "All Uploads" which links to the user's
 * All My Uploads page. The subdirectory is added to the front of the items
 * order, unless the user has manually reordered it.
 * @param directory The directory to add the subdirectory to. If not the home directory,
 * this function is a no-op.
 */
export function addAllUploads(directory?: Directory) {
    if (directory?.id !== HOME_DIRECTORY_ID) {
        return;
    }

    directory.items[ALL_MY_UPLOADS_DIRECTORY_ID] = {
        id: ALL_MY_UPLOADS_DIRECTORY_ID,
        type: DirectoryItemTypes.DIRECTORY,
        metadata: {
            name: 'All Uploads',
            description: 'Everything I have ever saved to the Dojo',
            visibility: DirectoryVisibility.PUBLIC,
            createdAt: directory.createdAt,
            updatedAt: directory.updatedAt,
        },
    };
    if (!directory.itemIds.includes(ALL_MY_UPLOADS_DIRECTORY_ID)) {
        directory.itemIds.unshift(ALL_MY_UPLOADS_DIRECTORY_ID);
    }
}
