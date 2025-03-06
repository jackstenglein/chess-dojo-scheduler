import Stripe from 'stripe';
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

    /**
     * The name of the tournament. For a waitlist, this is the number the tournament will have
     * once created.
     */
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

    /**
     * The usernames of the winners of the tournament. Only set for completed tournaments.
     */
    winners?: string[];
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

    /** The Stripe checkout session for players who paid to enter. */
    checkoutSession?: Stripe.Checkout.Session;
}

/** Stats for a player in a round robin tournament. */
export interface PlayerStats {
    /** The player's total score in the tournament so far. */
    score: number;
    /** The player's win count in the tournament so far. */
    wins: number;
    /** The player's draw count in the tournament so far. */
    draws: number;
    /** The player's loss count in the tournament so far. */
    losses: number;
    /** The number of games the player has played in the tournament so far. */
    played: number;
    /** The Sonneborn-Berger score of the player. https://en.wikipedia.org/wiki/Sonneborn%E2%80%93Berger_score */
    tiebreakScore: number;
}

/**
 * Calculates the PlayerStats for active players in the given tournament.
 * Only active players are included.
 * @param tournament The tournament to calculate the counts for.
 * @returns A map from username to stats for each active player in the tournament.
 */
export function calculatePlayerStats(tournament: RoundRobin) {
    const results: Record<string, PlayerStats> = {};

    for (const round of tournament.pairings) {
        for (const pairing of round) {
            if (
                !pairing.result ||
                tournament.players[pairing.white].status ===
                    RoundRobinPlayerStatuses.WITHDRAWN ||
                tournament.players[pairing.black].status ===
                    RoundRobinPlayerStatuses.WITHDRAWN
            ) {
                continue;
            }

            const white = results[pairing.white] || {
                score: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                played: 0,
                tiebreakScore: 0,
            };
            const black = results[pairing.black] || {
                score: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                played: 0,
                tiebreakScore: 0,
            };
            results[pairing.white] = white;
            results[pairing.black] = black;

            white.played++;
            black.played++;

            if (pairing.result === '1-0') {
                white.wins++;
                black.losses++;
            } else if (pairing.result === '1/2-1/2') {
                white.draws++;
                black.draws++;
            } else {
                white.losses++;
                black.wins++;
            }

            white.score = white.wins + white.draws / 2;
            black.score = black.wins + black.draws / 2;
        }
    }

    for (const round of tournament.pairings) {
        for (const pairing of round) {
            if (
                !pairing.result ||
                tournament.players[pairing.white].status ===
                    RoundRobinPlayerStatuses.WITHDRAWN ||
                tournament.players[pairing.black].status ===
                    RoundRobinPlayerStatuses.WITHDRAWN
            ) {
                continue;
            }

            if (pairing.result === '1-0') {
                results[pairing.white].tiebreakScore += results[pairing.black].score;
            } else if (pairing.result === '1/2-1/2') {
                results[pairing.white].tiebreakScore +=
                    0.5 * results[pairing.black].score;
                results[pairing.black].tiebreakScore +=
                    0.5 * results[pairing.white].score;
            } else {
                results[pairing.black].tiebreakScore += results[pairing.white].score;
            }
        }
    }

    return results;
}
