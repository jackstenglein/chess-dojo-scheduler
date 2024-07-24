import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import { once } from 'events';
import * as fs from 'fs';
import * as readline from 'readline';
import { Readable } from 'stream';
import { ExplorerPosition } from './types';

const chess = new Chess();

let processed = 0;
let failed = 0;
const PRINT_MOD = 1_000_000;

async function* processRecord(reader: readline.Interface) {
    for await (const line of reader) {
        try {
            const item = JSON.parse(line).Item;
            const position = unmarshall(item) as ExplorerPosition;

            chess.load(position.normalizedFen);
            const moves = chess.moves({ disableNullMoves: true });

            console.log('Position before: ', JSON.stringify(position, null, 2));
            const cohorts = Object.keys(position.results);

            for (const move of moves) {
                for (const cohort of cohorts) {
                    position.moves[move.san] = {
                        san: move.san,
                        results: {
                            ...position.moves[move.san]?.results,
                            [cohort]: {
                                ...position.moves[move.san]?.results[cohort],
                            },
                        },
                    };
                }
            }

            console.log('\n\nPosition after: ', JSON.stringify(position, null, 2));

            const newItem = { Item: marshall(position, { removeUndefinedValues: true }) };
            yield `${JSON.stringify(newItem)}\n`;
            processed++;

            if (processed % PRINT_MOD === 1) {
                console.log(
                    `${new Date().toISOString()} INFO: ${processed} success, ${failed} failed`,
                );
            }

            break;
        } catch (err) {
            console.log(
                `${new Date().toISOString()} ERROR: Failed to process record line: `,
                line,
                err,
            );
            failed++;
        }
    }
}

async function main() {
    const fileStream = fs.createReadStream('explorer-positions.json');
    const reader = readline.createInterface({ input: fileStream });
    const inputStream = Readable.from(processRecord(reader));
    const writeStream = fs.createWriteStream(`explorer-positions-full.json`);
    inputStream.pipe(writeStream);
    await once(writeStream, 'finish');

    console.log(
        `${new Date().toISOString()} INFO: Final results: ${processed} success, ${failed} failed`,
    );
}

main();
