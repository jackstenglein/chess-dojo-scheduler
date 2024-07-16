'use strict';

import {
    ConditionalCheckFailedException,
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    DirectoryItem,
    DirectoryItemType,
    DirectorySchema,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { z } from 'zod';
import { ApiError, errToApiGatewayProxyResultV2, getUserInfo, success } from './api';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const directoryTable = process.env.stage + '-directories';

const createDirectorySchema = DirectorySchema.pick({
    visibility: true,
}).merge(
    z.object({
        /** The full path of the directory containing the new directory. */
        parent: z
            .string()
            .trim()
            .regex(/^[ ./a-zA-Z0-9_-]*$/)
            .refine((val) => !val.includes('//')),

        /** The name of the directory to create. Must be a single component and therefore cannot contain / */
        name: z
            .string()
            .trim()
            .regex(/^[ .a-zA-Z0-9_-]+$/),
    }),
);

type createDirectoryRequest = z.infer<typeof createDirectorySchema>;

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
    if (parent?.items[request.name]) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `${parent.path}/${request.name} already exists`,
        });
    }

    if (!parent && request.parent === '') {
        parent = await createRootDirectory(userInfo.username, request);
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
        path: `${parent.path}/${request.name}`,
        visibility: request.visibility,
        items: {},
        createdAt: parent.items[request.name].metadata.createdAt,
        updatedAt: parent.items[request.name].metadata.createdAt,
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
function getRequest(event: APIGatewayProxyEventV2): createDirectoryRequest {
    try {
        const body = JSON.parse(event.body || '{}');
        return createDirectorySchema.parse(body);
    } catch (err) {
        console.error('Failed to unmarshall body: ', err);
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: body could not be unmarshaled',
            cause: err,
        });
    }
}

/**
 * Fetches the directory with the given owner and name from DynamoDB.
 * @param owner The owner of the directory.
 * @param name The full path name of the directory.
 * @returns The given directory, or undefined if it does not exist.
 */
async function fetchDirectory(
    owner: string,
    name: string,
): Promise<Directory | undefined> {
    const getItemOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                owner: { S: owner },
                name: { S: name },
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
 * Creates the root directory for the given user and request.
 * @param owner The username to create the root directory for.
 * @param request The create directory request that caused the root directory to be created.
 * @returns The created directory.
 */
async function createRootDirectory(
    owner: string,
    request: createDirectoryRequest,
): Promise<Directory> {
    const createdAt = new Date().toISOString();
    const directory = {
        owner,
        path: '',
        visibility: DirectoryVisibility.PUBLIC,
        createdAt,
        updatedAt: createdAt,
        items: {
            [request.name]: {
                type: DirectoryItemType.DIRECTORY,
                id: request.name,
                metadata: {
                    createdAt,
                    updatedAt: createdAt,
                    visibility: request.visibility,
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
                ConditionExpression: 'attribute_not_exists(owner)',
                TableName: directoryTable,
            }),
        );
    } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `${directory.path} already exists`,
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
    request: createDirectoryRequest,
): Promise<Directory> {
    const createdAt = new Date().toISOString();

    const subdirectory: DirectoryItem = {
        type: DirectoryItemType.DIRECTORY,
        id: request.name,
        metadata: {
            createdAt,
            updatedAt: createdAt,
            visibility: request.visibility,
        },
    };

    const input = new UpdateItemCommand({
        Key: {
            owner: { S: parent.owner },
            path: { S: parent.path },
        },
        ConditionExpression: 'attribute_not_exists(#items.#name)',
        UpdateExpression: `SET #items.#name = :directory, #updatedAt = :updatedAt`,
        ExpressionAttributeNames: {
            '#items': 'items',
            '#name': request.name,
        },
        ExpressionAttributeValues: {
            ':directory': { M: marshall(subdirectory) },
            ':updatedAt': { S: createdAt },
        },
        TableName: directoryTable,
        ReturnValues: 'NONE',
    });
    await dynamo.send(input);

    parent.items[request.name] = subdirectory;
    return parent;
}
