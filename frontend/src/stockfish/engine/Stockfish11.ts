import { EngineName } from './engine';
import { UciEngine } from './UciEngine';

/**
 * Runs Stockfish 11 HCE.
 */
export class Stockfish11 extends UciEngine {
    constructor() {
        const worker = UciEngine.workerFromPath('/engine/stockfish-11.js');
        super(EngineName.Stockfish11, worker);
    }
}
