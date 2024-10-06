
import { spawn } from 'child_process';

const path = '/opt/bin/stockfish'; // lambda layer fish binary exe path to push commands to

// lambda needs Nodejs 20.x 

export const handler = async (event) => {
    const fen = event.fen || "startpos";
    const depth = event.depth || 60;

    return new Promise((resolve, reject) => {
        const stockfish = spawn(path);

        // set different bench marks 
        // can try speedtest but I wasn't able to, bench does same job anyways
        // bench 1000 60 45 current depth
        // bench 29 60 34 current depth
        // try other bench variations but 1k to 2k mem with 60 threads really made lambda suffer
        // stockfish.stdin.write('bench 2000 120 45 current depth\n'); // this will throw error for mem of 3008
        // stockfish.stdin.write('go <>') // can use go also but bench was little better when testing
        
        stockfish.stdin.write('bench 2000 60 45 current depth\n');

        let output = '';

        
        stockfish.stdout.on('data', (data) => {
            const stockfishOutput = data.toString();
            output += stockfishOutput;

            
            console.log(stockfishOutput);
        });

        stockfish.on('close', () => {
            resolve({ statusCode: 200, body: output });
        });

       
        stockfish.on('error', (error) => {
            console.error('Error occurred:', error);
            reject({ statusCode: 500, body: error.toString() });
        });
    });
};
