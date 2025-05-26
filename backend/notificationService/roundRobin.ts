import {
    NotificationTypes,
    RoundRobinStartEvent,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { getGuildMember, sendDirectMessage } from './discord';
import { sendEmailTemplate } from './email';
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
        await handleEmailNotification(user, event.tournament);
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

/**
 * Sends an email notification for the round robin tournament starting.
 * @param user The user to notify.
 * @param tournament The tournament that started.
 */
async function handleEmailNotification(user: PartialUser | undefined, tournament: RoundRobin) {
    if (!user || user.notificationSettings?.emailNotificationSettings?.disableRoundRobinStart) {
        return;
    }

    const userPairings = tournament.pairings
        .flat()
        .filter((p) => p.white === user.username || p.black === user.username);
    const pairingText = userPairings
        .map((p, idx) => {
            return `Round ${idx + 1}\nWhite: ${p.white ? tournament.players[p.white].displayName : 'Bye'}\nBlack: ${p.black ? tournament.players[p.black].displayName : 'Bye'}`;
        })
        .join('\n\n');
    const pairingHtml = userPairings
        .map((p, idx) => {
            return `<tr>
            <td style="padding-left: 4px">${idx + 1}</td>
            <td style="padding-left: 4px">${p.white ? tournament.players[p.white].displayName : 'Bye'}</td>
            <td style="padding-left: 4px">${p.black ? tournament.players[p.black].displayName : 'Bye'}</td>
        </tr>`;
        })
        .join('\n');

    const templateData = {
        name: `${tournament.cohort} ${tournament.name}`,
        tournamentUrl: `${frontendHost}/tournaments/round-robin?cohort=${tournament.cohort}`,
        timeControl: timeControls[tournament.cohort],
        numWeeks: `${tournament.playerOrder.length + 1}`,
        pairingHtml,
        pairingText,
    };

    await sendEmailTemplate(
        'roundRobin/tournamentStarted',
        templateData,
        [user.email],
        'ChessDojo Round Robin <roundrobin@mail.chessdojo.club>',
    );
    console.log(
        `Successfully sent email to ${user.username} for ${NotificationTypes.ROUND_ROBIN_START}`,
    );
}

/** Minimum time control by cohort */
const timeControls: Record<string, string> = {
    '0-300': '30+0',
    '300-400': '30+0',
    '400-500': '30+0',
    '500-600': '30+0',
    '600-700': '30+0',
    '700-800': '30+0',
    '800-900': '30+30',
    '900-1000': '30+30',
    '1000-1100': '30+30',
    '1100-1200': '30+30',
    '1200-1300': '45+30',
    '1300-1400': '45+30',
    '1400-1500': '45+30',
    '1500-1600': '45+30',
    '1600-1700': '60+30',
    '1700-1800': '60+30',
    '1800-1900': '60+30',
    '1900-2000': '60+30',
    '2000-2100': '90+30',
    '2100-2200': '90+30',
    '2200-2300': '90+30',
    '2300-2400': '90+30',
    '2400+': '90+30',
};
