import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { explorerGames, processRecord, processed, skipped } from './processGame';

const MIN_FILE = 1;
const MAX_FILE = 2;

async function main() {
    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log('INFO: starting game file %d', i);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const inputStream = Readable.from(processRecord(reader));
        const writeStream = fs.createWriteStream(`output-${i}.json`);

        inputStream.pipe(writeStream);
        await once(writeStream, 'finish');
    }

    console.log(
        'INFO: Read all games. Processed: %d, skipped: %d, total: %d',
        processed,
        skipped,
        processed + skipped,
    );
    console.log('INFO: Total explorer games created: %d', explorerGames);
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);
}

main();
