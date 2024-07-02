import { marshall } from '@aws-sdk/util-dynamodb';
import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { processRecord, processed } from './processGame';
import { ExplorerPosition } from './types';

const MIN_FILE = 0;
const MAX_FILE = 1;

async function main() {
    const positions: Record<string, ExplorerPosition> = {};

    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log('INFO: starting game file %d', i);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const inputStream = Readable.from(processRecord(reader, positions));
        const writeStream = fs.createWriteStream(`output-${i}.json`);

        inputStream.pipe(writeStream);
        await once(inputStream, 'finish');
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
