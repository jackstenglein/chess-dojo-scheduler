import { EngineName } from './eval';
import { UciEngine } from './UciEngine';

export class Stockfish11 extends UciEngine {
    constructor() {
        super(EngineName.Stockfish11, '/engine/stockfish-11.js');
    }
}
