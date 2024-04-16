/** A single problem in a tactics test. */
export interface TacticsProblem {
    /** The side to move first in the problem. */
    orientation: 'white' | 'black';

    /** The FEN of the starting position. */
    fen: string;

    /** The PGN of the solution to the problem. */
    solution: string;
}

/** A tactics test consisting of multiple problems. */
export interface TacticsTest {
    /** The hash key for the tactics table. Always set to TEST for TacticsTest objects. */
    type: 'TEST';

    /** The v4 UUID of the tactics test. */
    id: string;
}
