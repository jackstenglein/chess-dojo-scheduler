'use strict';

import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    Directory,
    DirectorySchema,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { ApiError, errToApiGatewayProxyResultV2, requireUserInfo, success } from './api';
import { directoryTable, dynamo } from './database';

const getDirectorySchema = DirectorySchema.pick({ owner: true, id: true });

/**
 * Handles requests to the get directory API. Returns an error if the directory does
 * not exist or is private and the caller is not the owner.
 * @param event The API gateway event that triggered the request.
 * @returns The requested directory.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = getRequest(event);
        const directory = await fetchDirectory(request.owner, request.id);

        if (
            !directory ||
            (directory.visibility === DirectoryVisibility.PRIVATE &&
                directory.owner !== userInfo.username)
        ) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: 'Directory not found or is private',
            });
        }

        return success(directory);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Extracts a getDirectoryRequest from the given API gateway event.
 * @param event The event to extract the request from.
 * @returns The getDirectoryRequest specified in the API gateway event.
 */
function getRequest(event: APIGatewayProxyEventV2) {
    try {
        return getDirectorySchema.parse(event.pathParameters);
    } catch (err) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: body could not be unmarshaled',
            cause: err,
        });
    }
}

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
