import { z } from 'zod';

const DiscordConnectRequestSchema = z.object({
    mode: z.literal('connect'),
    code: z.string(),
    /** The redirect URI used in the Discord oauth flow. */
    redirectUri: z.string().optional(),
});

const DiscordDisconnectRequestSchema = z.object({
    mode: z.literal('disconnect'),
});

/** Verifies a request to update Discord authentication. */
export const DiscordAuthRequestSchema = z.discriminatedUnion('mode', [
    DiscordConnectRequestSchema,
    DiscordDisconnectRequestSchema,
]);

/** The type of a request to connect a Discord account. */
export type DiscordConnectRequest = z.infer<typeof DiscordConnectRequestSchema>;
/** The type of a request to update Discord authentication. */
export type DiscordAuthRequest = z.infer<typeof DiscordAuthRequestSchema>;
