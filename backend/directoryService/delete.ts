import { DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    DeleteDirectorySchema,
    Directory,
    DirectorySchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    errToApiGatewayProxyResultV2,
    parsePathParameters,
    requireUserInfo,
    success,
} from './api';
import { directoryTable, dynamo } from './database';

/**
 * Handles requests to the delete directory API. Returns the directory as
 * it was before the delete. If the directory did not exist, returns undefined.
 * @param event The API gateway event that triggered the request.
 * @returns The directory before the delete, or undefined if it did not exist.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, DeleteDirectorySchema);
        const directory = await deleteDirectory(userInfo.username, request.id);
        return success(directory);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Deletes the specified directory from DynamoDB. Subdirectories are not deleted
 * and must be explicitly deleted separately.
 * @param owner The owner of the directory.
 * @param id The id of the directory.
 * @returns The directory object as it was before deletion.
 */
export async function deleteDirectory(
    owner: string,
    id: string,
): Promise<Directory | undefined> {
    const output = await dynamo.send(
        new DeleteItemCommand({
            Key: {
                owner: { S: owner },
                id: { S: id },
            },
            TableName: directoryTable,
            ReturnValues: 'ALL_OLD',
        }),
    );
    if (!output.Attributes) {
        return undefined;
    }

    const directory = unmarshall(output.Attributes);
    return DirectorySchema.parse(directory);
}
