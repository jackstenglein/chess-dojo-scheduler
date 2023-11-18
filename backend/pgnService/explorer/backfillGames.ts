import { AttributeValue, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { handler } from './processGame';
import { Context, DynamoDBStreamEvent } from 'aws-lambda';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const gamesTable = process.env.stage + '-games';

async function main() {
    let processed = 0;
    let startKey: Record<string, AttributeValue> | undefined = undefined;

    try {
        do {
            console.log('Start Key: %j', startKey);
            console.log('Processed: ', processed);

            const scanInput = new ScanCommand({
                ExclusiveStartKey: startKey,
                TableName: gamesTable,
            });

            console.log('Scan Input: %j', scanInput);

            const scanOutput = await dynamo.send(scanInput);

            let records =
                scanOutput.Items?.map((item) => ({
                    dynamodb: {
                        NewImage: item,
                    },
                })) ?? [];

            console.log('Processing %d records', records.length);
            await handler(
                { Records: records } as DynamoDBStreamEvent,
                undefined as unknown as Context,
                () => null
            );

            processed += records.length;
            startKey = scanOutput.LastEvaluatedKey;
        } while (startKey);
    } catch (err) {
        console.error('Failed to scan games: ', err);
    }

    console.log('Processed: ', processed);
    console.log('Start Key: %j', startKey);
}

main();
