import { Context, DynamoDBRecord } from 'aws-lambda';
import * as fs from 'fs';
import * as readline from 'readline';
import { handler } from './processGame';

const RECORDS_PER_BATCH = 100;
const MIN_FILE = 0;
const MAX_FILE = 1;
const EXPLORER_ID_FILE = 'explorerIdsDev.txt';
const STOP_AFTER_FIRST_BATCH = true;

async function main() {
    let processed = 0;

    const explorerIds = new Set<string>();

    const fileStream = fs.createReadStream(EXPLORER_ID_FILE);
    const reader = readline.createInterface({ input: fileStream });
    const writeStream = fs.createWriteStream(EXPLORER_ID_FILE, { flags: 'a' });

    for await (const line of reader) {
        explorerIds.add(line.trim());
    }

    console.log('INFO: Got %d games already indexed', explorerIds.size);

    let records: DynamoDBRecord[] = [];

    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log('INFO: starting game file %d', i);
        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });

        for await (const line of reader) {
            const item = JSON.parse(line).Item;
            if (item.cohort.S === 'masters' && !explorerIds.has(item.id.S)) {
                writeStream.write(item.id.S + '\n');

                records.push({ dynamodb: { NewImage: item } });

                if (records.length >= RECORDS_PER_BATCH) {
                    await handler(
                        { Records: records },
                        undefined as unknown as Context,
                        () => null,
                    );

                    processed += records.length;
                    console.log('INFO: handled %d records', records.length);
                    console.log('INFO: total processed: %d', processed);
                    records = [];

                    if (STOP_AFTER_FIRST_BATCH) {
                        break;
                    }
                }
            }
        }
    }

    if (records.length > 0) {
        await handler({ Records: records }, undefined as unknown as Context, () => null);
        console.log('INFO: handled %d records', records.length);
        processed += records.length;
    }

    console.log('INFO: COMPLETE. Total processed: %d', processed);
}

main();
