import { z } from 'zod';

/** Verifies the type of a request to get the next puzzle. */
export const nextPuzzleRequestSchema = z.object({
    /** The results of the previous puzzle the user just played, if applicable. */
    previousPuzzle: z
        .object({
            /** The id of the puzzle. */
            id: z.string(),
            /** The result of the puzzle, from the player's perspective. */
            result: z.union([z.literal('win'), z.literal('draw'), z.literal('loss')]),
            /** The time spent on the puzzle. */
            timeSpentSeconds: z.number(),
            /** The user's final PGN on the puzzle. */
            pgn: z.string(),
        })
        .optional(),
    /** The themes that the next puzzle must be in. The puzzle must match any of the themes. */
    themes: z.string().array().min(1).optional(),
    /** The rough rating level of the next puzzle, relative to the user's rating. */
    relativeRating: z.array(z.number()).length(2).optional(),
});

/** A request to get the next puzzle. */
export type NextPuzzleRequest = z.infer<typeof nextPuzzleRequestSchema>;

export interface Puzzle {
    /** The ID of the puzzle. */
    id: string;
    /** The FEN of the starting position of the puzzle. */
    fen: string;
    /** The moves to play in the puzzle, starting with the opponent's first move. */
    moves: string[];
    /** The current rating of the puzzle. */
    rating: number;
    /** The number of times the puzzle has been played. */
    plays: number;
    /** The number of times the puzzle has been successfully completed. */
    successfulPlays: number;
    /** The themes of the puzzle. */
    themes: string[];
}

/** The response to get the next puzzle. */
export interface NextPuzzleResponse {
    /** The next puzzle to play. */
    puzzle: Puzzle;
    /** The user's current rating. */
    rating: number;
}
