import { marshall } from '@aws-sdk/util-dynamodb';
import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { processRecord, processed } from './processGame';
import { ExplorerPosition } from './types';

const MIN_FILE = 1;
const MAX_FILE = 2;

function* generatePositions(positions: Map<string, ExplorerPosition>) {
    for (const position of positions.values()) {
        yield `${JSON.stringify({ Item: marshall(position, { removeUndefinedValues: true }) })}\n`;
    }
}

async function main() {
    const positions = new Map<string, ExplorerPosition>();

    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log('INFO: starting game file %d', i);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const inputStream = Readable.from(processRecord(reader, positions));
        const writeStream = fs.createWriteStream(`output-${i}.json`);

        inputStream.pipe(writeStream);
        await once(writeStream, 'finish');
    }

    console.log('INFO: Read all games. Total processed: %d', processed);
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);

    console.log('INFO: Writing %d positions', positions.size);

    const inputStream = Readable.from(generatePositions(positions));
    const writeStream = fs.createWriteStream(
        `output-positions-${MIN_FILE}-${MAX_FILE}.json`,
    );
    inputStream.pipe(writeStream);
    await once(inputStream, 'finish');
}

main();
