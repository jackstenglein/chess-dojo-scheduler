/** The name of an available engine. */
export enum EngineName {
    Stockfish17 = 'stockfish_17',
    Stockfish16 = 'stockfish_16',
    Stockfish11 = 'stockfish_11',
}

export interface EngineInfo {
    /** The internal name of the engine. */
    name: EngineName;

    /** The full user-facing name of the engine. */
    fullName: string;

    /** The short user-facing name of the engine. */
    shortName: string;

    /** The technology used by the engine. */
    tech: string;

    /** The description of the technology used by the engine. */
    techDescription: string;

    /** A user-facing description of where the engine runs. */
    location: string;
}

/** The list of engines available for use. */
export const engines: EngineInfo[] = [
    {
        name: EngineName.Stockfish17,
        fullName: 'Stockfish 17 NNUE • Desktop • 79 MB',
        shortName: 'SF 17 • 79 MB',
        tech: 'NNUE',
        techDescription: `Evaluation is performed by Stockfish's neural network.`,
        location: 'in local browser',
    },
    {
        name: EngineName.Stockfish16,
        fullName: 'Stockfish 16.1 NNUE • Mobile • 6 MB',
        shortName: 'SF 16 • 6 MB',
        tech: 'NNUE',
        techDescription: `Evaluation is performed by Stockfish's neural network.`,
        location: 'in local browser',
    },
    {
        name: EngineName.Stockfish11,
        fullName: 'Stockfish 11 HCE',
        shortName: 'SF 11',
        tech: 'HCE',
        techDescription: `Evaluation is performed using various heuristics and rules. Faster, but much less accurate than NNUE.`,
        location: 'in local browser',
    },
];

/** Local storage key for the name of the engine. */
export const ENGINE_NAME_KEY = 'engine-name';

/** Local storage key for the number of lines calculated by the engine. */
export const ENGINE_LINE_COUNT_KEY = 'engine-multi-pv';

/** Local storage key for the depth of the engine, in plies. */
export const ENGINE_DEPTH_KEY = 'engine-depth';

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
    /** The number of nodes per second evaluated by the engine. */
    nps?: number;
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
