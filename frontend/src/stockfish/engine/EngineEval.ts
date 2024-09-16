import { Move } from 'chess.js';
import { EngineName } from './engineEnum';

export interface SavedEval {
    bestMove?: string;
    lines: LineEval[];
    engine: EngineName;
}

export type SavedEvals = Record<string, SavedEval | undefined>;

export interface PositionEval {
    bestMove?: string;
    opening?: string;
    lines: LineEval[];
}

export interface LineEval {
    pv: string[];
    cp?: number;
    mate?: number;
    depth: number;
    multiPv: number;
}

export interface Accuracy {
    white: number;
    black: number;
}

export interface EngineSettings {
    engine: EngineName;
    depth: number;
    multiPv: number;
    date: string;
}

export interface GameEval {
    positions: PositionEval[];
    accuracy: Accuracy;
    settings: EngineSettings;
}

/** Evaluates the given position, updating the eval as the engine runs. */
export interface EvaluatePositionWithUpdateParams {
    /** The FEN to evaluate. */
    fen: string;
    /** The depth to use when evaluating. */
    depth?: number;
    /** The number of lines to analyze. */
    multiPv?: number;
    /** The callback function that is sent eval updates. */
    setPartialEval?: (positionEval: PositionEval) => void;
}

export interface CurrentPosition {
    lastMove?: Move;
    eval?: PositionEval;
    lastEval?: PositionEval;
    currentMoveIdx?: number;
}

export interface EvaluateGameParams {
    fens: string[];
    uciMoves: string[];
    depth?: number;
    multiPv?: number;
    setEvaluationProgress?: (value: number) => void;
}
