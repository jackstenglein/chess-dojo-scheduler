import { EngineName } from './engineEnum';
import { UciEngine } from './uciEngine';

export class Stockfish11 extends UciEngine {
    constructor() {
        super(EngineName.Stockfish11, '/engine/stockfish-11.js');
    }
}
