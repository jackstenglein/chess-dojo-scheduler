import { z } from 'zod';

/** The maximum number of players in a round robin. */
export const MAX_ROUND_ROBIN_PLAYERS = 10;

/** Verifies a request to register for the round robin. */
export const RoundRobinRegisterSchema = z.object({
    /** The cohort of the tournament. */
    cohort: z.string(),

    /** The display name of the player registering. */
    displayName: z.string(),

    /** The Lichess username of the player registering. */
    lichessUsername: z.string(),

    /** The Chess.com username of the player registering. */
    chesscomUsername: z.string(),

    /** The discord username of the player registering. */
    discordUsername: z.string().optional(),
});

/** A request to register for a round robin. */
export type RoundRobinRegisterRequest = z.infer<typeof RoundRobinRegisterSchema>;

/** Verifies a request to withdraw from a round robin. */
export const RoundRobinWithdrawSchema = z.object({
    /** The cohort of the round robin to withdraw from. */
    cohort: z.string(),

    /** The startsAt field of the round robin to withdraw from. */
    startsAt: z.string().regex(/^(ACTIVE|WAITING)/),
});

/** A request to withdraw from a round robin. */
export type RoundRobinWithdrawRequest = z.infer<typeof RoundRobinWithdrawSchema>;

/** Verifies a request to submit a game for a round robin. */
export const RoundRobinSubmitGameSchema = z.object({
    /** The cohort of the tournament. */
    cohort: z.string(),

    /** The startsAt field of the tournament. */
    startsAt: z.string().regex(/^ACTIVE/),

    /** The url of the game to submit. */
    url: z.string(),
});

/** A request to submit a game for a round robin. */
export type RoundRobinSubmitGameRequest = z.infer<typeof RoundRobinSubmitGameSchema>;

const roundRobinStatus = z.enum(['ACTIVE', 'WAITING', 'COMPLETE']);

export const RoundRobinStatuses = roundRobinStatus.enum;

/** Verifies a request to list round robin tournaments. */
export const RoundRobinListSchema = z.object({
    /** The cohort to fetch tournaments in. */
    cohort: z.string(),

    /** Filters based on the status of the tournaments. */
    status: roundRobinStatus.optional(),

    /** The start key to use for pagination. */
    startKey: z.string().optional(),
});

/** A request to list round robin tournaments. */
export type RoundRobinListRequest = z.infer<typeof RoundRobinListSchema>;

export type RoundRobinWaitlist = Pick<
    RoundRobin,
    'type' | 'startsAt' | 'cohort' | 'players'
>;

export interface RoundRobin {
    /** The hash key of the tournaments table. For round robins, this is the value ROUND_ROBIN_<cohort>. */
    type: string;

    /**
     * The range key of the tournaments table. For round robins, this value has the following form:
     *   - If the tournament is running, it is ACTIVE_<ISO start date>
     *   - If the tournament is waiting, it is WAITING
     *   - If the tournament is over, it is COMPLETE_<ISO start date>
     */
    startsAt: string;

    /** The cohort of the round robin. */
    cohort: string;

    /** The name of the tournament. */
    name: string;

    /** The start date of the tournament in ISO format. */
    startDate: string;

    /** The end date of the tournament in ISO format. */
    endDate: string;

    /**
     * The players in the tournament, mapped by their usernames.
     * A running round robin can only have MAX_ROUND_ROBIN_PLAYERS players.
     */
    players: Record<string, RoundRobinPlayer>;

    /** The order of the players' usernames in the tournament when pairing. */
    playerOrder: string[];

    /**
     * The pairings for the tournament. The first level of the array corresponds
     * to the round number. Once this field is set, the order of the pairings
     * never changes.
     */
    pairings: RoundRobinPairing[][];
}

/** A single pairing in a round robin. */
export interface RoundRobinPairing {
    /** The username of the player with white. */
    white: string;

    /** The username of the player with black. */
    black: string;

    /** The result of the game. */
    result?: '1-0' | '1/2-1/2' | '0-1';

    /** The URL of the game. */
    url?: string;
}

const roundRobinPlayerStatus = z.enum([
    /** The player is active in the tournament. */
    'ACTIVE',
    /** The player is withdrawn from the tournament. */
    'WITHDRAWN',
]);

export type RoundRobinPlayerStatus = z.infer<typeof roundRobinPlayerStatus>;

export const RoundRobinPlayerStatuses = roundRobinPlayerStatus.enum;

export interface RoundRobinPlayer {
    /** The username of the player. */
    username: string;

    /** The Dojo display name of the player. */
    displayName: string;

    /** The Lichess username of the player. */
    lichessUsername: string;

    /** The Chess.com username of the player. */
    chesscomUsername: string;

    /** The Discord username of the player registering. */
    discordUsername?: string;

    /** The status of the player. */
    status: RoundRobinPlayerStatus;
}
