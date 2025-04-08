import { BatchGetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Lambda } from '@aws-sdk/client-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { ExportDirectorySchema } from '@jackstenglein/chess-dojo-common/src/database/directory';
import AdmZip from 'adm-zip';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { appendFileSync, closeSync, openSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from './api';
import { dynamo, gameTable, UpdateItemBuilder } from './database';

const s3Client = new S3Client({ region: 'us-east-1' });
const s3Bucket = `chess-dojo-${process.env.stage}-game-database`;
const lambdaClient = new Lambda({ region: 'us-east-1' });
const directoryExportTable = `${process.env.stage}-directory-exports`;
const runExportLambdaName = `chess-dojo-directories-${process.env.stage}-runExport`;

export const startExport: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, ExportDirectorySchema);
        const id = uuidv4();

        await dynamo.send(
            new PutItemCommand({
                Item: marshall(
                    {
                        username: userInfo.username,
                        id,
                        status: exportDirectoryRunStatus.enum.IN_PROGRESS,
                        progress: 0,
                        request,
                        ttl: Math.floor((new Date().getTime() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
                    },
                    { removeUndefinedValues: true },
                ),
                TableName: directoryExportTable,
            }),
        );

        const response = await lambdaClient.invoke({
            FunctionName: runExportLambdaName,
            InvocationType: 'Event',
            Payload: JSON.stringify({ username: userInfo.username, id, request }),
        });
        if (response.StatusCode !== 202) {
            throw new ApiError({
                statusCode: 500,
                publicMessage: 'Temporary server error',
                privateMessage: `runExport lambda invocation returned status ${response.StatusCode}`,
            });
        }
        return success({ id });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

const exportDirectoryRunStatus = z.enum(['IN_PROGRESS', 'COMPLETED']);

const exportDirectoryRunSchema = z.object({
    username: z.string(),
    id: z.string(),
    request: ExportDirectorySchema,
});

export const runExport = async (e: object) => {
    console.log('Event: %j', e);
    const event = exportDirectoryRunSchema.parse(e);
    const fd = openSync(`/tmp/${event.id}.pgn`, 'a');

    for (let i = 0; i < (event.request.games?.length ?? 0); i += 100) {
        const batch = event.request.games?.slice(i, i + 100) ?? [];
        const response = await dynamo.send(
            new BatchGetItemCommand({
                RequestItems: {
                    [gameTable]: {
                        Keys: batch.map((g) => ({ cohort: { S: g.cohort }, id: { S: g.id } })),
                        ProjectionExpression: 'pgn',
                    },
                },
            }),
        );
        if (!response.Responses?.[gameTable]) {
            throw new ApiError({ statusCode: 500, publicMessage: 'No responses from game table' });
        }
        const pgns: string[] = response.Responses[gameTable].map((g) =>
            new Chess({ pgn: unmarshall(g).pgn }).renderPgn(),
        );
        appendFileSync(fd, pgns.join('\n\n\n') + '\n\n\n');

        const input = new UpdateItemBuilder()
            .key('username', event.username)
            .key('id', event.id)
            .add('progress', batch.length)
            .table(directoryExportTable)
            .build();
        await dynamo.send(input);
    }

    closeSync(fd);

    const zip = new AdmZip();
    zip.addLocalFile(`/tmp/${event.id}.pgn`, '', 'dojo-export.pgn');

    const response = await s3Client.send(
        new PutObjectCommand({
            Bucket: s3Bucket,
            Key: `exports/${event.username}/${event.id}.zip`,
            Body: zip.toBuffer(),
        }),
    );
    console.log('Response from S3: ', response);

    const input = new UpdateItemBuilder()
        .key('username', event.username)
        .key('id', event.id)
        .set('status', exportDirectoryRunStatus.enum.COMPLETED)
        .table(directoryExportTable)
        .build();
    await dynamo.send(input);
};
