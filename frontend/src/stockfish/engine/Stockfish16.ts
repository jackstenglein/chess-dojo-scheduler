import { EngineName } from './engine';
import { UciEngine } from './UciEngine';

/**
 * Runs Stockfish 16.1 NNUE (6 MB mobile version).
 */
export class Stockfish16 extends UciEngine {
    constructor() {
        if (!Stockfish16.isSupported()) {
            throw new Error('Stockfish 16 is not supported');
        }

        const enginePath =
            '/static/engine/stockfish-16.1-lite.js#/static/engine/stockfish-16.1-lite.wasm';
        const worker = UciEngine.workerFromPath(enginePath);
        super(EngineName.Stockfish16, worker);
    }

    public static isSupported() {
        return (
            typeof WebAssembly === 'object' &&
            WebAssembly.validate(
                Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
            )
        );
    }
}
