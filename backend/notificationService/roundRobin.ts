import {
    NotificationTypes,
    RoundRobinStartEvent,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { getGuildMember, sendDirectMessage } from './discord';
import { getNotificationSettings, PartialUser } from './user';

const notificationTable = `${process.env.stage}-notifications`;
const frontendHost = process.env.frontendHost;

/**
 * Creates notifications for round robin start events.
 * @param event The event to create notifications for.
 */
export async function handleRoundRobinStart(event: RoundRobinStartEvent) {
    for (const username of Object.keys(event.tournament.players)) {
        const user = await getNotificationSettings(username);
        await handleSiteNotification(user, event.tournament);
        await handleDiscordNotification(user, event.tournament);
    }
}

/**
 * Sends a site notification for the round robin tournament starting.
 * @param user The user to notify.
 * @param tournament The tournament that started.
 */
async function handleSiteNotification(user: PartialUser | undefined, tournament: RoundRobin) {
    if (!user) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', user.username)
        .key(
            'id',
            `${NotificationTypes.ROUND_ROBIN_START}|${tournament.cohort}|${tournament.startsAt}`,
        )
        .set('type', NotificationTypes.ROUND_ROBIN_START)
        .set('updatedAt', new Date().toISOString())
        .set('roundRobinStartMetadata', {
            cohort: tournament.cohort,
            startsAt: tournament.startsAt,
            name: tournament.name,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.ROUND_ROBIN_START} notification for ${user.username}`,
    );
}

/**
 * Sends a discord notification for the round robin tournament starting.
 * @param user The user to notify.
 * @param tournament The tournament that started.
 */
async function handleDiscordNotification(user: PartialUser | undefined, tournament: RoundRobin) {
    if (
        !user ||
        !user.discordUsername ||
        user.notificationSettings?.discordNotificationSettings?.disableRoundRobinStart
    ) {
        return;
    }

    const discordId = user.discordId ?? (await getGuildMember(user.discordUsername)).user.id;
    const message = `Round robin tournament ${tournament.cohort} ${tournament.name} has started. Click [**here**](${frontendHost}/tournaments/round-robin?cohort=${tournament.cohort}) to view rules/pairings and submit games.`;
    await sendDirectMessage(discordId, message);
    console.log(
        `Successfully sent Discord message to ${user.username} for ${NotificationTypes.ROUND_ROBIN_START}`,
    );
}
