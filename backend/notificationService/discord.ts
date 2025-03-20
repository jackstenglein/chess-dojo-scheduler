import { ApiError } from 'chess-dojo-directory-service/api';
import { Client, Events, GatewayIntentBits, GuildMember, TextChannel } from 'discord.js';

const privateGuildId = process.env.discordPrivateGuildId || '';

/**
 * @returns A logged-in and ready discord client.
 */
async function getClient() {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    const readyClientPromise = new Promise<Client<true>>((resolve) => {
        client.once(Events.ClientReady, (readyClient) => resolve(readyClient));
    });
    await client.login(process.env.discordAuth);
    const readyClient = await readyClientPromise;
    return readyClient;
}

/**
 * Sends the given message in the given channel.
 * @param channelId The id of the channel to send a message in.
 * @param message The message to send.
 */
export async function sendChannelMessage(channelId: string, message: string) {
    const client = await getClient();
    const channel = client.channels.cache.get(channelId);
    await (channel as TextChannel | undefined)?.send(message);
}

/**
 * Sends the given direct message to the given user.
 * @param userId The id of the user to DM.
 * @param message The message to send.
 */
export async function sendDirectMessage(userId: string, message: string) {
    const client = await getClient();
    await client.users.send(userId, message);
}

/**
 * Returns the guild member with the given username.
 * @param discordUsername The discord username of the member to fetch.
 */
export async function getGuildMember(discordUsername: string): Promise<GuildMember> {
    const client = await getClient();
    const guild = client.guilds.cache.get(privateGuildId);
    if (!guild) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Internal server error',
            privateMessage: 'Failed to get Discord guild',
        });
    }

    discordUsername = discordUsername.split('#')[0];
    const members = await guild.members.search({ query: discordUsername, limit: 1000 });
    const member = members.first();
    if (!member) {
        throw new ApiError({
            statusCode: 404,
            publicMessage: `Discord username ${discordUsername} not found in the ChessDojo server`,
        });
    }

    return member;
}
