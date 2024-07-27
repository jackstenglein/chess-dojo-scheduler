'use strict';

import {
    ConditionalCheckFailedException,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import {
    CreateDirectoryRequest,
    CreateDirectorySchema,
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
    DirectoryVisibility,
    HOME_DIRECTORY_ID,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { NIL as uuidNil, v4 as uuidv4 } from 'uuid';
import { ApiError, errToApiGatewayProxyResultV2, getUserInfo, success } from './api';
import { directoryTable, dynamo } from './database';
import { fetchDirectory } from './get';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const result = await handleCreateDirectory(event);
        return success(result);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Handles requests to the create directory API. Fails if the parent directory
 * already contains a child with the requested name. Also fails if the parent
 * does not exist, unless the parent is the root directory, in which case the
 * root directory is also created.
 * @param event The API gateway event of the request.
 * @returns The newly-created directory and the updated parent.
 */
async function handleCreateDirectory(event: APIGatewayProxyEventV2) {
    const userInfo = getUserInfo(event);
    if (!userInfo.username) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: username is required',
        });
    }

    const request = getRequest(event);

    let parent = await fetchDirectory(userInfo.username, request.parent);
    if (
        Object.values(parent?.items || {}).some(
            (item) => item.type === 'DIRECTORY' && item.metadata.name === request.name,
        )
    ) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `${parent?.name}/${request.name} already exists`,
        });
    }

    if (!parent && request.parent === HOME_DIRECTORY_ID) {
        parent = await createHomeDirectory(userInfo.username, request);
    } else if (parent) {
        parent = await addSubDirectory(parent, request);
    } else {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `${request.parent} does not exist or you do not own it`,
        });
    }

    const child: Directory = {
        owner: userInfo.username,
        id: request.id,
        parent: request.parent,
        name: request.name,
        visibility: request.visibility,
        items: {},
        createdAt: parent.items[request.id].metadata.createdAt,
        updatedAt: parent.items[request.id].metadata.createdAt,
    };
    await createDirectory(child);

    return {
        directory: child,
        parent,
    };
}

/**
 * Extracts a createDirectoryRequest from the API gateway event.
 * @param event The event to extract the request from.
 * @returns The createDirectoryRequest specified in the API gateway event.
 */
function getRequest(event: APIGatewayProxyEventV2): CreateDirectoryRequest {
    try {
        const body = JSON.parse(event.body || '{}');
        if (body) {
            body.id = uuidv4();
        }
        return CreateDirectorySchema.parse(body);
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: body could not be unmarshaled',
            cause: err,
        });
    }
}

/**
 * Creates the root directory for the given user and request.
 * @param owner The username to create the root directory for.
 * @param request The create directory request that caused the root directory to be created.
 * @returns The created directory.
 */
async function createHomeDirectory(
    owner: string,
    request: CreateDirectoryRequest,
): Promise<Directory> {
    const createdAt = new Date().toISOString();
    const directory = {
        owner,
        id: HOME_DIRECTORY_ID,
        parent: uuidNil,
        name: 'Home',
        visibility: DirectoryVisibility.PUBLIC,
        createdAt,
        updatedAt: createdAt,
        items: {
            [request.id]: {
                type: DirectoryItemTypes.DIRECTORY,
                id: request.id,
                metadata: {
                    createdAt,
                    updatedAt: createdAt,
                    visibility: request.visibility,
                    name: request.name,
                },
            },
        },
    };
    await createDirectory(directory);
    return directory;
}

/**
 * Puts the given directory in DynamoDB, if it does not already exist.
 * @param directory The directory to create.
 */
async function createDirectory(directory: Directory) {
    try {
        await dynamo.send(
            new PutItemCommand({
                Item: marshall(directory),
                ExpressionAttributeNames: { '#owner': 'owner' },
                ConditionExpression: 'attribute_not_exists(#owner)',
                TableName: directoryTable,
            }),
        );
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `${directory.name} already exists`,
                cause: err,
            });
        }
        throw new ApiError({ statusCode: 500, cause: err });
    }
}

/**
 * Adds a subdirectory as an item to the given parent directory.
 * @param parent The parent directory to add the subdirectory to.
 * @param request The request to create the subdirectory.
 * @returns The updated parent directory.
 */
async function addSubDirectory(
    parent: Directory,
    request: CreateDirectoryRequest,
): Promise<Directory> {
    const createdAt = new Date().toISOString();

    const subdirectory: DirectoryItem = {
        type: DirectoryItemTypes.DIRECTORY,
        id: request.id,
        metadata: {
            createdAt,
            updatedAt: createdAt,
            visibility: request.visibility,
            name: request.name,
        },
    };

    const input = new UpdateItemCommand({
        Key: {
            owner: { S: parent.owner },
            id: { S: parent.id },
        },
        ConditionExpression: 'attribute_not_exists(#items.#id)',
        UpdateExpression: `SET #items.#id = :directory, #updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
            '#items': 'items',
            '#id': request.id,
            '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
            ':directory': { M: marshall(subdirectory) },
            ':updatedAt': { S: createdAt },
        },
        TableName: directoryTable,
        ReturnValues: 'NONE',
    });
    await dynamo.send(input);

    parent.items[request.id] = subdirectory;
    return parent;
}
