import { EngineName } from './engine';
import { EngineWorker } from './EngineWorker';
import makeModule from './sf17-79.js';
import { UciEngine } from './UciEngine';

/**
 * Runs Stockfish 17 NNUE (79 MB desktop version).
 */
export class Stockfish17 extends UciEngine {
    constructor() {
        if (!Stockfish17.isSupported()) {
            throw new Error('Stockfish 17 is not supported');
        }

        super(EngineName.Stockfish17);
    }

    public async init() {
        const worker: EngineWorker = await new Promise((resolve, reject) => {
            makeModule({
                wasmMemory: sharedWasmMemory(2560),
                onError: (msg: string) => reject(new Error(msg)),
            })
                .then(resolve)
                .catch(reject);
        });

        (await this.getModels(['nn-1111cefa1111.nnue', 'nn-37f18f62d772.nnue'])).forEach(
            (nnueBuffer, i) => worker.setNnueBuffer?.(nnueBuffer, i),
        );

        this.worker = worker;
        await super.init();
    }

    public static isSupported() {
        return (
            typeof WebAssembly === 'object' &&
            WebAssembly.validate(
                Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
            )
        );
    }

    private getModels(nnueFilenames: string[]): Promise<Uint8Array[]> {
        return Promise.all(
            nnueFilenames.map(async (nnueFilename) => {
                const req = new XMLHttpRequest();

                req.open('get', `/static/engine/nnue/${nnueFilename}`, true);
                req.responseType = 'arraybuffer';
                req.onprogress = (e) => console.log(e);

                const nnueBuffer = await new Promise<Uint8Array>((resolve, reject) => {
                    req.onerror = () =>
                        reject(new Error(`NNUE download failed: ${req.status}`));
                    req.onload = () => {
                        if (req.status / 100 === 2)
                            resolve(new Uint8Array(req.response as Iterable<number>));
                        else reject(new Error(`NNUE download failed: ${req.status}`));
                    };
                    req.send();
                });
                return nnueBuffer;
            }),
        );
    }
}

export const sharedWasmMemory = (lo: number, hi = 32767): WebAssembly.Memory => {
    let shrink = 4; // 32767 -> 24576 -> 16384 -> 12288 -> 8192 -> 6144 -> etc
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return new WebAssembly.Memory({ shared: true, initial: lo, maximum: hi });
        } catch (e) {
            if (hi <= lo || !(e instanceof RangeError)) throw e;
            hi = Math.max(lo, Math.ceil(hi - hi / shrink));
            shrink = shrink === 4 ? 3 : 4;
        }
    }
};
