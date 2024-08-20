import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { close, initialize } from './cache';
import { processRecord, processed, skipped } from './processGame';

const MIN_FILE = 0;
const MAX_FILE = 26;

const gamesToTwic = {
    '23': '1548',
    '25': '1550',
    '26': '1551',
};

async function main() {
    await initialize();

    for (const [gameNum, twicNum] of Object.entries(gamesToTwic)) {
        console.log(`${new Date().toISOString()} INFO ${gameNum}: starting game file`);

        const fileStream = fs.createReadStream(`/home/ec2-user/games-${gameNum}.json`);
        const reader = readline.createInterface({ input: fileStream });
        const inputStream = Readable.from(processRecord(gameNum, reader));
        const writeStream = fs.createWriteStream(`output-${gameNum}.json`);

        inputStream.pipe(writeStream);
        await once(writeStream, 'finish');
        console.log(`${new Date().toISOString()} INFO ${gameNum}: finished game file`);
    }

    console.log(
        `${new Date().toISOString()} INFO: Read all games. Processed: ${processed}, skipped: ${skipped}, total: ${skipped + processed}`,
    );
    console.log('INFO: Total Heap Used %d', process.memoryUsage().heapUsed);

    console.log('INFO: closing mongo');
    await close();
}

main();
