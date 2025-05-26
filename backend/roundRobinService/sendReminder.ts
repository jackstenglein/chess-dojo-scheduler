import { AttributeValue, QueryCommand, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { dojoCohorts } from '@jackstenglein/chess-dojo-common/src/database/cohort';
import {
    calculatePlayerStats,
    RoundRobin,
    RoundRobinPlayerStatuses,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { ScheduledEvent } from 'aws-lambda';
import { dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { sendDirectMessage } from 'chess-dojo-notification-service/discord';
import { sendEmailTemplate } from 'chess-dojo-notification-service/email';
import { getNotificationSettings } from 'chess-dojo-notification-service/user';
import { tournamentsTable } from './register';

const frontendHost = process.env.frontendHost;

/**
 * Handles a CloudWatch cron job to send reminders for all active round robin
 * tournaments. Reminders are sent to active players who have submitted zero games
 * for a tournament that has been active for >=2 weeks.
 * @param event The scheduled event that triggered the handler.
 */
export const handler = async (event: ScheduledEvent) => {
    console.log('Event: %j', event);
    for (const cohort of dojoCohorts) {
        try {
            await processCohort(cohort);
        } catch (err) {
            console.error(`Failed to process cohort ${cohort}: `, err);
        }
    }
};

/**
 * Fetches active round robin tournaments for the given cohort and sends
 * reminders to the players, as necessary.
 * @param cohort The cohort to process.
 */
async function processCohort(cohort: string) {
    console.log('Processing cohort: ', cohort);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    let lastEvaluatedKey: Record<string, AttributeValue> | undefined = undefined;

    do {
        const output: QueryCommandOutput = await dynamo.send(
            new QueryCommand({
                KeyConditionExpression: '#type = :type AND begins_with(#startsAt, :active)',
                FilterExpression: '#startDate <= :twoWeeksAgo AND #reminderSent = :false',
                ExpressionAttributeNames: {
                    '#type': 'type',
                    '#startsAt': 'startsAt',
                    '#startDate': 'startDate',
                    '#reminderSent': 'reminderSent',
                },
                ExpressionAttributeValues: {
                    ':type': { S: `ROUND_ROBIN_${cohort}` },
                    ':active': { S: 'ACTIVE' },
                    ':twoWeeksAgo': { S: twoWeeksAgo.toISOString() },
                    ':false': { BOOL: false },
                },
                ExclusiveStartKey: lastEvaluatedKey,
                TableName: tournamentsTable,
            })
        );

        for (const item of output.Items ?? []) {
            await processTournament(unmarshall(item) as RoundRobin);
        }

        lastEvaluatedKey = output.LastEvaluatedKey;
    } while (lastEvaluatedKey);
}

/**
 * Sends reminders to the players of the given tournament, as necessary.
 * @param tournament The tournament to process.
 */
async function processTournament(tournament: RoundRobin) {
    console.log('Processing tournament: ', tournament.name);

    const playerStats = calculatePlayerStats(tournament);
    console.log('Player stats: ', playerStats);

    for (const player of Object.values(tournament.players)) {
        if (
            player.status === RoundRobinPlayerStatuses.ACTIVE &&
            !playerStats[player.username]?.played
        ) {
            await sendReminder(tournament, player.username);
        }
    }

    const input = new UpdateItemBuilder()
        .key('type', tournament.type)
        .key('startsAt', tournament.startsAt)
        .set('reminderSent', true)
        .set('updatedAt', new Date().toISOString())
        .return('NONE')
        .table(tournamentsTable)
        .build();
    await dynamo.send(input);
}

/**
 * Sends a reminder for the given tournament to the given username. The
 * user is sent both an email and a Discord DM.
 * @param tournament The tournament to remind the user of.
 * @param username The user to send the reminders to.
 */
async function sendReminder(tournament: RoundRobin, username: string) {
    console.log(`Sending reminder to user ${username}`);

    const user = await getNotificationSettings(username);
    if (!user) {
        return;
    }

    const discordId = user.discordId || tournament.players[username].discordId;
    if (discordId) {
        const message = `Your round robin tournament ${tournament.cohort} ${tournament.name} has been running for 2 weeks, and you haven't submitted any games! Click [**here**](${frontendHost}/tournaments/round-robin?cohort=${tournament.cohort}) to view your pairings and submit games. Not playing your games creates a poor experience for the other players, and failure to submit any games will result in a $15 fee the next time you register for a round robin.`;
        await sendDirectMessage(discordId, message);
        console.log(
            `Successfully sent Discord message to ${user.username} for round robin reminder`
        );
    }

    const templateData = {
        name: `${tournament.cohort} ${tournament.name}`,
        tournamentUrl: `${frontendHost}/tournaments/round-robin?cohort=${tournament.cohort}`,
    };
    await sendEmailTemplate(
        'roundRobin/tournamentReminder',
        templateData,
        [user.email],
        'ChessDojo Round Robin <roundrobin@mail.chessdojo.club>'
    );
    console.log(`Successfully sent email to ${user.username} for round robin reminder`);
}
