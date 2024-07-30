import * as fs from 'fs';
import * as readline from 'readline';
import { close, initialize } from './cache';
import { processRecord, processed, skipped } from './processGame';

const MIN_FILE = 0;
const MAX_FILE = 26;

async function main() {
    await initialize();

    for (let i = MIN_FILE; i < MAX_FILE; i++) {
        console.log(`${new Date().toISOString()} INFO ${i}: starting game file`);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${i}.json`);
        const reader = readline.createInterface({ input: fileStream });
        await processRecord(i, reader);

        console.log(`${new Date().toISOString()} INFO ${i}: finished game file`);
    }

    console.log(
        `${new Date().toISOString()} INFO: Read all games. Processed: ${processed}, skipped: ${skipped}, total: ${skipped + processed}`,
    );
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);

    console.log('INFO: closing mongo');
    await close();
}

main();
