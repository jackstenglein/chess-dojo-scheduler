import { Collection, MongoClient } from 'mongodb';
import { ExplorerPosition } from './types';

// const dynamo = new DynamoDBClient({
//     region: 'us-east-1',
//     endpoint: 'http://localhost:8000',
// });
// const mastersTable = 'local-masters';

const client = new MongoClient('mongodb://localhost:27017');
let collection: Collection<ExplorerPosition> | null = null;

export async function initialize() {
    await client.connect();
    const db = client.db('masters');
    collection = db.collection<ExplorerPosition>('documents');
    const result = await collection.createIndex({ normalizedFen: 1 });
    console.log(`${new Date().toISOString()} INFO: created index: ${result}`);
}

export function close() {
    return client.close();
}

export async function set(position: ExplorerPosition) {
    await collection!.replaceOne({ normalizedFen: position.normalizedFen }, position, {
        upsert: true,
    });
}

export async function get(fen: string): Promise<ExplorerPosition | undefined> {
    const position = await collection!.findOne({ normalizedFen: fen });
    return (position as ExplorerPosition) || null;

    // if (cache.has(fen)) {
    //     return cache.get(fen)!;
    // }

    // const input = new GetItemCommand({
    //     Key: {
    //         normalizedFen: {
    //             S: fen,
    //         },
    //         id: {
    //             S: 'POSITION',
    //         },
    //     },
    //     TableName: mastersTable,
    // });

    // const output = await dynamo.send(input);
    // if (!output.Item) {
    //     return undefined;
    // }

    // return unmarshall(output.Item) as ExplorerPosition;
}

// async function writeToDynamo() {
//     console.log(`${new Date().toISOString()} INFO: Writing cache to Dynamo`);

//     let entries: ExplorerPosition[] = [];
//     for (const entry of cache) {
//         entries.push(entry[1]);

//         if (entries.length === 25) {
//             await dynamo.send(
//                 new BatchWriteItemCommand({
//                     RequestItems: {
//                         [mastersTable]: entries.map((e) => ({
//                             PutRequest: {
//                                 Item: marshall(e),
//                             },
//                         })),
//                     },
//                 }),
//             );
//             entries = [];
//         }
//     }

//     if (entries.length > 0) {
//         await dynamo.send(
//             new BatchWriteItemCommand({
//                 RequestItems: {
//                     [mastersTable]: entries.map((e) => ({
//                         PutRequest: {
//                             Item: marshall(e),
//                         },
//                     })),
//                 },
//             }),
//         );
//         entries = [];
//     }

//     cache.clear();
// }
