import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { explorerGames, processRecord, processed, skipped } from './processGame';

const MIN_FILE = 0;
const MAX_FILE = 13;

async function main() {
    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log(`${new Date().toISOString()} INFO ${i}: starting game file`);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const inputStream = Readable.from(processRecord(i, reader));
        const writeStream = fs.createWriteStream(`output-${i}.json`);

        inputStream.pipe(writeStream);
        await once(writeStream, 'finish');
        console.log(`${new Date().toISOString()} INFO ${i}: finished game file`);
    }

    console.log(
        `${new Date().toISOString()} INFO: Read all games. Processed: ${processed}, skipped: ${skipped}, total: ${skipped + processed}`,
    );
    console.log('INFO: Total explorer games created: %d', explorerGames);
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);
}

main();
