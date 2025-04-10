import { BatchGetItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { Lambda } from '@aws-sdk/client-lambda';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    CheckExportDirectorySchema,
    Directory,
    DirectoryAccessRole,
    DirectoryItemTypes,
    ExportDirectoryRequest,
    ExportDirectoryRun,
    exportDirectoryRunSchema,
    exportDirectoryRunStatus,
    ExportDirectorySchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import AdmZip from 'adm-zip';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { appendFileSync, closeSync, openSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { checkAccess } from './access';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from './api';
import { directoryTable, dynamo, gameTable, UpdateItemBuilder } from './database';

const s3Bucket = `chess-dojo-${process.env.stage}-game-database`;
const directoryExportTable = `${process.env.stage}-directory-exports`;
const runExportLambdaName = `chess-dojo-directories-${process.env.stage}-runExport`;

export const startExport: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, ExportDirectorySchema);
        const id = uuidv4();

        const run: ExportDirectoryRun = {
            username: userInfo.username,
            id,
            status: exportDirectoryRunStatus.enum.IN_PROGRESS,
            progress: 0,
            total: 0,
            request,
            startedAt: new Date().toISOString(),
            ttl: Math.floor((new Date().getTime() + 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days
        };

        await dynamo.send(
            new PutItemCommand({
                Item: marshall(run, { removeUndefinedValues: true }),
                TableName: directoryExportTable,
            }),
        );

        const lambdaClient = new Lambda({ region: 'us-east-1' });
        const response = await lambdaClient.invoke({
            FunctionName: runExportLambdaName,
            InvocationType: 'Event',
            Payload: JSON.stringify(run),
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

export const runExport = async (event: object) => {
    console.log('Event: %j', event);
    const run = exportDirectoryRunSchema.parse(event);
    const games = (run.request.games ?? []).concat(
        ...(await fetchGameInfoFromDirectories(run.username, run.request)),
    );

    if (games.length === 0) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Invalid request: no games to export',
        });
    }

    await dynamo.send(
        new UpdateItemBuilder()
            .key('username', run.username)
            .key('id', run.id)
            .set('total', games.length)
            .table(directoryExportTable)
            .build(),
    );

    const shouldRerender = Object.values(run.request.options ?? {}).some((v) => v);
    const fd = openSync(`/tmp/${run.id}.pgn`, 'a');
    console.log('Fetching %d total games: ', games.length, JSON.stringify(games));
    for (let i = 0; i < games.length; i += 100) {
        const batch = games.slice(i, i + 100);
        console.log('Fetching batch of %d games: ', batch.length, JSON.stringify(batch));
        const batchInput = new BatchGetItemCommand({
            RequestItems: {
                [gameTable]: {
                    Keys: batch.map((g) => ({ cohort: { S: g.cohort }, id: { S: g.id } })),
                    ProjectionExpression: 'pgn',
                },
            },
        });
        const response = await dynamo.send(batchInput);
        if (!response.Responses?.[gameTable]) {
            throw new ApiError({ statusCode: 500, publicMessage: 'No responses from game table' });
        }
        const pgns: string[] = response.Responses[gameTable].map((g) =>
            shouldRerender
                ? new Chess({ pgn: unmarshall(g).pgn }).renderPgn(run.request.options)
                : unmarshall(g).pgn,
        );
        appendFileSync(fd, pgns.join('\n\n\n') + '\n\n\n');

        const input = new UpdateItemBuilder()
            .key('username', run.username)
            .key('id', run.id)
            .add('progress', batch.length)
            .table(directoryExportTable)
            .build();
        await dynamo.send(input);
    }
    closeSync(fd);

    const zip = new AdmZip();
    zip.addLocalFile(`/tmp/${run.id}.pgn`, '', 'dojo-export.pgn');

    const s3Client = new S3Client({ region: 'us-east-1' });
    const response = await s3Client.send(
        new PutObjectCommand({
            Bucket: s3Bucket,
            Key: `exports/${run.username}/${run.id}.zip`,
            Body: zip.toBuffer(),
        }),
    );
    console.log('Response from S3: ', response);

    await dynamo.send(
        new UpdateItemBuilder()
            .key('username', run.username)
            .key('id', run.id)
            .set('status', exportDirectoryRunStatus.enum.COMPLETED)
            .set('completedAt', new Date().toISOString())
            .table(directoryExportTable)
            .build(),
    );
};

async function fetchGameInfoFromDirectories(username: string, request: ExportDirectoryRequest) {
    let queue = request.directories ?? [];
    let topLevel = true;
    const games: { cohort: string; id: string }[] = [];

    while (queue.length) {
        const nextQueue = [];

        for (let i = 0; i < queue.length; i += 100) {
            const batch = queue.slice(i, i + 100) ?? [];
            const response = await dynamo.send(
                new BatchGetItemCommand({
                    RequestItems: {
                        [directoryTable]: {
                            Keys: batch.map((d) => ({ owner: { S: d.owner }, id: { S: d.id } })),
                            ProjectionExpression: '#owner, id, parent, #items, access',
                            ExpressionAttributeNames: { '#owner': 'owner', '#items': 'items' },
                        },
                    },
                }),
            );
            if (!response.Responses?.[directoryTable]) {
                throw new ApiError({
                    statusCode: 500,
                    publicMessage: 'No responses from directory table',
                });
            }

            const directories = response.Responses[directoryTable].map(
                (d) => unmarshall(d) as Directory,
            );
            for (const directory of directories) {
                if (
                    topLevel &&
                    !checkAccess({
                        owner: directory.owner,
                        id: directory.id,
                        username,
                        role: DirectoryAccessRole.Viewer,
                        directory,
                    })
                ) {
                    throw new ApiError({
                        statusCode: 403,
                        publicMessage: `User ${username} does not have viewer access for directory ${directory.owner}/${directory.id}`,
                    });
                }

                games.push(
                    ...Object.values(directory.items)
                        .filter((item) => item.type !== DirectoryItemTypes.DIRECTORY)
                        .map((g) => ({ cohort: g.metadata.cohort, id: g.metadata.id })),
                );

                if (request.recursive) {
                    nextQueue.push(
                        ...Object.values(directory.items)
                            .filter((item) => item.type === DirectoryItemTypes.DIRECTORY)
                            .map((d) => ({ owner: directory.owner, id: d.id })),
                    );
                }
            }
        }

        queue = nextQueue;
        topLevel = false;
    }

    return games;
}

export const checkExport: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);
        const userInfo = requireUserInfo(event);
        const request = parseEvent(event, CheckExportDirectorySchema);

        const getItemOutput = await dynamo.send(
            new GetItemCommand({
                Key: {
                    username: { S: userInfo.username },
                    id: { S: request.id },
                },
                TableName: directoryExportTable,
            }),
        );
        if (!getItemOutput.Item) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: 'Export directory run not found',
                privateMessage: `${userInfo.username}/${request.id} not found`,
            });
        }
        const run = exportDirectoryRunSchema.parse(unmarshall(getItemOutput.Item));

        if (run.status === exportDirectoryRunStatus.enum.COMPLETED) {
            const s3Client = new S3Client({ region: 'us-east-1' });
            const command = new GetObjectCommand({
                Bucket: s3Bucket,
                Key: `exports/${run.username}/${run.id}.zip`,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            run.downloadUrl = url;
        }

        return success(run);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};
