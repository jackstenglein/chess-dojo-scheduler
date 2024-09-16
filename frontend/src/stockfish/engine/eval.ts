/** The name of an available engine. */
export enum EngineName {
    Stockfish16 = 'stockfish_16',
    Stockfish16NNUE = 'stockfish_16_nnue',
    Stockfish11 = 'stockfish_11',
}

/** The evaluation of a specific position. */
export interface PositionEval {
    /** The best move chosen by the engine. */
    bestMove?: string;
    /** The name of the opening of the position. */
    opening?: string;
    /** The lines evaluated by the engine. */
    lines: LineEval[];
}

/** The evaluation of a single line. */
export interface LineEval {
    /** The FEN of the starting position in the line. */
    fen: string;
    /** The moves chosen by the engine in UCI format. */
    pv: string[];
    /** The numeric evaluation of the line. */
    cp?: number;
    /** The number of moves to mate. */
    mate?: number;
    /** The depth of the line. */
    depth: number;
    /** The Multi PV value of the engine while calculating the line. */
    multiPv: number;
}

/** A cached evaluation of a specific position. */
export type SavedEval = PositionEval & {
    /** The name of the engine that generated the evaluation. */
    engine: EngineName;
};

/** A map from FEN to saved evaluation. */
export type SavedEvals = Record<string, SavedEval | undefined>;

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
