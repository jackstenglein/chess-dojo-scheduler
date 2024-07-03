import {
    BatchWriteItemCommand,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ExplorerPosition } from './types';

const dynamo = new DynamoDBClient({
    region: 'us-east-1',
    endpoint: 'http://localhost:8080',
});
const mastersTable = 'local-masters';

const cache = new Map<string, ExplorerPosition>();

const MAX_CACHE_SIZE = 2_000_000;

export async function set(position: ExplorerPosition) {
    cache.set(position.normalizedFen, position);

    if (cache.size > MAX_CACHE_SIZE) {
        await writeToDynamo();
    }
}

export async function get(fen: string): Promise<ExplorerPosition | undefined> {
    if (cache.has(fen)) {
        return cache.get(fen)!;
    }

    const input = new GetItemCommand({
        Key: {
            normalizedFen: {
                S: fen,
            },
            id: {
                S: 'POSITION',
            },
        },
        TableName: mastersTable,
    });

    const output = await dynamo.send(input);
    if (!output.Item) {
        return undefined;
    }

    return unmarshall(output.Item) as ExplorerPosition;
}

async function writeToDynamo() {
    console.log(`${new Date().toISOString()} INFO: Writing cache to Dynamo`);

    let entries: ExplorerPosition[] = [];
    for (const entry of cache) {
        entries.push(entry[1]);

        if (entries.length === 25) {
            await dynamo.send(
                new BatchWriteItemCommand({
                    RequestItems: {
                        [mastersTable]: entries.map((e) => ({
                            PutRequest: {
                                Item: marshall(e),
                            },
                        })),
                    },
                }),
            );
            entries = [];
        }
    }

    if (entries.length > 0) {
        await dynamo.send(
            new BatchWriteItemCommand({
                RequestItems: {
                    [mastersTable]: entries.map((e) => ({
                        PutRequest: {
                            Item: marshall(e),
                        },
                    })),
                },
            }),
        );
        entries = [];
    }

    cache.clear();
}
