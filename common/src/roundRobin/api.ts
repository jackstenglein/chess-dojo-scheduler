import { z } from 'zod';

export const FindRoundRobinIdSchema = z.object({
    cohort: z.string(),
});

export type FindRoundRobinIdRequest = z.infer<typeof FindRoundRobinIdSchema>;

export const RoundRobinRegisterSchema = z.object({
    /** The cohort of the tournament. */
    cohort: z.string(),

    /** The Lichess username of the player registering. */
    lichessUsername: z.string(),

    /** The Chess.com username of the player registering. */
    chesscomUsername: z.string(),

    /** The discord username of the player registering. */
    discordUsername: z.string().optional(),
});

/** A request to register for a round robin. */
export type RoundRobinRegisterRequest = z.infer<typeof RoundRobinRegisterSchema>;

export const RoundRobinWithdrawSchema = z.object({
    /** The cohort of the round robin to withdraw from. */
    cohort: z.string(),

    /** The id of the round robin to withdraw from. */
    id: z.string(),
});

/** A request to withdraw from a round robin. */
export type RoundRobinWithdrawRequest = z.infer<typeof RoundRobinWithdrawSchema>;

export interface RoundRobin {
    /** The cohort of the round robin. */
    cohort: string;

    /** The id of the round robin. */
    id: string;

    /** The name of the tournament. */
    name: string;

    /** The description of the tournament. */
    description: string;

    /** The start date of the tournament in ISO format. */
    startDate: string;

    /** The end date of the tournament in ISO format. */
    endDate: string;

    /** The players in the tournament, mapped by their usernames. */
    players: Record<string, RoundRobinPlayer>;
}

export interface RoundRobinPlayer {
    /** The username of the player. */
    username: string;

    /** The Lichess username of the player. */
    lichessUsername: string;

    /** The Chess.com username of the player. */
    chesscomUsername: string;

    /** The Discord username of the player registering. */
    discordUsername: string;
}
