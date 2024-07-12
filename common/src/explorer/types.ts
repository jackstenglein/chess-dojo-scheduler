/** The category of a result in Lichess tablebase. */
export enum LichessTablebaseCategory {
    Win = 'win',
    MaybeWin = 'maybe-win',
    CursedWin = 'cursed-win',
    Draw = 'draw',
    BlessedLoss = 'blessed-loss',
    MaybeLoss = 'maybe-loss',
    Loss = 'loss',
    Unknown = 'unknown',
}

/** A single position as returned by the Lichess tablebase API. */
export interface LichessTablebasePosition {
    /** The category of the position. */
    category: LichessTablebaseCategory;

    /** The distance to zeroing of the 50-move counter, with rounding. */
    dtz: number | null;

    /** The distance to mate (only for positions with <= 5 pieces). */
    dtm: number | null;

    /** Information about legal moves, with the best moves first. */
    moves: LichessTablebaseMove[];
}

/** A single move option in the Lichess tablebase API. */
export interface LichessTablebaseMove {
    /** The SAN of the move. */
    san: string;

    /** The category of the move. */
    category: LichessTablebaseCategory;

    /** The distance to zeroing of the 50-move counter, with rounding. */
    dtz: number | null;

    /** The distance to mate (only for positions with <= 5 pieces). */
    dtm: number | null;

    /** Whether the move zeros the 50-move counter. */
    zeroing: boolean;
}

/**
 * Returns true if the given FEN should be in tablebase, based on the number of pieces.
 * @param fen The FEN to check.
 */
export function isInTablebase(fen: string): boolean {
    const position = fen.split(' ')[0];
    let count = 0;
    for (const char of position.toLowerCase()) {
        if (char >= 'a' && char <= 'z') {
            count++;
            if (count > 7) {
                return false;
            }
        }
    }
    return true;
}
