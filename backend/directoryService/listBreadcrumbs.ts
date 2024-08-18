import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { NIL as uuidNil } from 'uuid';
import { errToApiGatewayProxyResultV2, parsePathParameters, success } from './api';
import { directoryTable, dynamo } from './database';
import { getDirectorySchema } from './get';

/**
 * Handles requests to the list breadcrumbs API. This API fetches the name, id and
 * parent for the given directory, as well as all parent directories above it.
 * @param event The API gateway event that triggered the request.
 * @returns The breadcrumb data for the requested directory.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const request = parsePathParameters(event, getDirectorySchema);
        const breadcrumbs = await fetchBreadcrumbs(request.owner, request.id);
        return success(breadcrumbs);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Fetches the breadcrumb data for the given directory, as well as all of its
 * parent directories.
 * @param owner The owner of the directory to fetch the breadcrumbs for.
 * @param id The id of the directory to fetch the breadcrumbs for.
 * @returns A map from the owner/id of each directory to its breadcrumb data.
 */
async function fetchBreadcrumbs(owner: string, id: string) {
    const results: Record<string, { id: string; name: string; parent: string }> = {};

    while (id && id !== uuidNil) {
        const getItemOutput = await dynamo.send(
            new GetItemCommand({
                Key: {
                    owner: { S: owner },
                    id: { S: id },
                },
                ProjectionExpression: '#name, #parent, #id',
                ExpressionAttributeNames: {
                    '#name': 'name',
                    '#parent': 'parent',
                    '#id': 'id',
                },
                TableName: directoryTable,
            }),
        );
        if (!getItemOutput.Item) {
            return results;
        }

        const directory = unmarshall(getItemOutput.Item) as Directory;
        results[`${owner}/${id}`] = {
            id,
            name: directory.name,
            parent: directory.parent,
        };
        id = directory.parent;
    }

    return results;
}
