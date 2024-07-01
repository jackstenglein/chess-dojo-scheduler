import { marshall } from '@aws-sdk/util-dynamodb';
import * as fs from 'fs';
import * as readline from 'readline';
import { processRecord } from './processGame';
import { ExplorerPosition } from './types';

const MIN_FILE = 0;
const MAX_FILE = 1;
const PRINT_MOD = 10000;

async function main() {
    let processed = 0;

    const positions: Record<string, ExplorerPosition> = {};

    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log('INFO: starting game file %d', i);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const writeStream = fs.createWriteStream(`output-${i}.json`);

        for await (const line of reader) {
            const item = JSON.parse(line).Item;

            if (item.cohort.S === 'masters') {
                processRecord(item, positions, writeStream);
                processed++;

                if (processed % PRINT_MOD === 0) {
                    console.log('INFO: Processed %d', processed);
                    console.log('INFO: Heap Used %d', process.memoryUsage().heapUsed);
                }
            }
        }
    }

    console.log('INFO: Read all games. Total processed: %d', processed);
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);

    console.log('INFO: Writing Positions');

    const writeStream = fs.createWriteStream(`output-positions.json`);
    for (const position of Object.values(positions)) {
        writeStream.write(
            JSON.stringify({ Item: marshall(position, { removeUndefinedValues: true }) }),
        );
        writeStream.write('\n');
    }
}

main();
