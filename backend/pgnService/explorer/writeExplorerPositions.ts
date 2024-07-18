import { marshall } from '@aws-sdk/util-dynamodb';
import { once } from 'events';
import * as fs from 'fs';
import { Collection, FindCursor, MongoClient, WithId } from 'mongodb';
import { Readable } from 'stream';
import { ExplorerPosition } from './types';

const client = new MongoClient('mongodb://localhost:27017');
let collection: Collection<ExplorerPosition> | null = null;

const PRINT_MOD = 10_000;
let count = 0;

async function* cursorToStream(cursor: FindCursor<WithId<ExplorerPosition>>) {
    for await (const item of cursor) {
        const dynamoItem = {
            Item: marshall(
                {
                    normalizedFen: item.normalizedFen,
                    id: item.id,
                    results: item.results,
                    moves: item.moves,
                },
                { removeUndefinedValues: true },
            ),
        };

        count++;
        if (count % PRINT_MOD === 1) {
            console.log(`${new Date().toISOString()} INFO: processed ${count} positions`);
        }

        yield `${JSON.stringify(dynamoItem)}\n`;
    }
}

async function main() {
    await client.connect();
    const db = client.db('masters');
    collection = db.collection<ExplorerPosition>('documents');
    const cursor = collection.find();

    const inputStream = Readable.from(cursorToStream(cursor));
    const writeStream = fs.createWriteStream('explorer-positions.json');

    inputStream.pipe(writeStream);
    await once(writeStream, 'finish');

    client.close();
}

main();
