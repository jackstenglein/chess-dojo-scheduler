import { z } from 'zod';

export const ResultType = z.enum(['win', 'draw', 'loss']);

export const TimeClass = z.enum(['bullet', 'blitz', 'rapid', 'classical', 'daily']);

export const PlayerExplorerRequestSchema = z.object({
    /** The ID of the player to fetch. */
    player: z.number(),
    /** The FEN of the position to fetch. */
    fen: z.string(),
    /** The color of the player in the games. */
    color: z.literal('white').or(z.literal('black')),
    /** The results of the games relative to the fetched player. */
    result: ResultType.array().optional(),
    /** The rated/casual mode of the games. */
    mode: z.union([z.literal('rated'), z.literal('casual')]).optional(),
    /** The time controls of the games. */
    timeClass: TimeClass.array().optional(),
    /** The opponent rating range of the games. */
    opponentRating: z.array(z.number().int().optional()).optional(),
    /** The range of the number of plies in the games. */
    plyCount: z.array(z.number().int().optional()).optional(),
    /** The max number of games to fetch, sorted by date descending. */
    limit: z.number().int().min(100).optional(),
});

/** The request to fetch a position from the player explorer API. */
export type PlayerExplorerRequest = z.infer<typeof PlayerExplorerRequestSchema>;

/** Verifies the format of a player explorer response. */
export const PlayerExplorerResponseSchema = z
    .object({
        /** The SAN of the move. */
        san: z.string(),
        /** The sum of the normalized ELO of the players with white. */
        totalWhiteElo: z.number().int(),
        /** The sum of the normalized ELO of the players with black. */
        totalBlackElo: z.number().int(),
        /** The total number of games. */
        total: z.number().int(),
        /** The number of games where white won. */
        white: z.number().int(),
        /** The number of games where black won.. */
        black: z.number().int(),
        /** The number of drawn games. */
        draws: z.number().int(),
    })
    .array();

/** The response from the player explorer API. */
export type PlayerExplorerResponse = z.infer<typeof PlayerExplorerResponseSchema>;
