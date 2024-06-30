import { Context } from 'aws-lambda';
import * as fs from 'fs';
import * as readline from 'readline';
import { handler } from './processGame';

async function main() {
    let processed = 0;

    const explorerIds = new Set<string>();

    const fileStream = fs.createReadStream('explorerIds.txt');
    const reader = readline.createInterface({ input: fileStream });

    for await (const line of reader) {
        explorerIds.add(line.trim());
    }

    console.log('INFO: Got %d games already indexed', explorerIds.size);

    let promises: Promise<void>[] = [];

    for (let i = 0; i < 1; i++) {
        const fileStream = fs.createReadStream(`games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });

        for await (const line of reader) {
            const item = JSON.parse(line).Item;
            if (item.cohort.S === 'masters' && !explorerIds.has(item.id.S)) {
                promises.push(
                    handler(
                        { Records: [{ dynamodb: { NewImage: item } }] },
                        undefined as unknown as Context,
                        () => null,
                    ) as Promise<void>,
                );

                if (promises.length >= 5) {
                    await Promise.all(promises);
                    processed += promises.length;
                    console.log('INFO: handled %d records', promises.length);
                    console.log('INFO: total processed: %d', processed);
                    promises = [];
                    break;
                }
            }
        }
    }

    if (promises.length > 0) {
        await Promise.all(promises);
        console.log('INFO: handled %d records', promises.length);
        processed += promises.length;
    }
    console.log('INFO: total processed: %d', processed);
}

main();
