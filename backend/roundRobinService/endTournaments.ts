'use strict';

import {
    DeleteItemCommand,
    PutItemCommand,
    QueryCommand,
    QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dojoCohorts } from '@jackstenglein/chess-dojo-common/src/database/cohort';
import {
    calculatePlayerStats,
    RoundRobin,
    RoundRobinPlayer,
    RoundRobinPlayerStatuses,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { ScheduledEvent } from 'aws-lambda';
import { attributeExists, dynamo, UpdateItemBuilder } from 'chess-dojo-directory-service/database';
import { tournamentsTable } from './register';

const usersTable = `${process.env.stage}-users`;

/**
 * Handles a CloudWatch cron job to list all running round robin tournaments
 * and end any which have an end date in the past. Tournaments are ended by
 * setting their status to COMPLETE and setting the winners of the tournament.
 * @param event The scheduled event that triggered the handler.
 */
export const handler = async (event: ScheduledEvent) => {
    console.log('Event: ', event);
    for (const cohort of dojoCohorts) {
        try {
            await processCohort(cohort);
        } catch (err) {
            console.error('Failed to process cohort: ', cohort, err);
        }
    }
};

/**
 * Checks all active tournaments for the given cohort and completes any that
 * have an end date in the past.
 * @param cohort The cohort to check tournaments for.
 */
async function processCohort(cohort: string) {
    const now = new Date().toISOString();

    const input: QueryCommandInput = {
        KeyConditionExpression: '#type = :type AND begins_with(#startsAt, :status)',
        FilterExpression: '#endDate < :endDate',
        ExpressionAttributeNames: {
            '#type': 'type',
            '#startsAt': 'startsAt',
            '#endDate': 'endDate',
        },
        ExpressionAttributeValues: {
            ':type': { S: `ROUND_ROBIN_${cohort}` },
            ':status': { S: 'ACTIVE' },
            ':endDate': { S: now },
        },
        TableName: tournamentsTable,
    };

    let lastEvaluatedKey = undefined;
    do {
        input.ExclusiveStartKey = lastEvaluatedKey;
        const output = await dynamo.send(new QueryCommand(input));
        const tournaments = (output.Items?.map((item) => unmarshall(item)) || []) as RoundRobin[];
        for (const t of tournaments) {
            try {
                await markComplete(t);
            } catch (err) {
                console.error('Failed to process tournament: ', t, err);
            }
        }
        lastEvaluatedKey = output.LastEvaluatedKey;
    } while (lastEvaluatedKey);
}

/**
 * Sets the winners for the tournament, marks it as complete and deletes
 * the active tournament from the database. Players who did not play any
 * games are added to the list of banned players.
 * @param tournament The tournament to mark complete.
 */
async function markComplete(tournament: RoundRobin) {
    console.log(`Completing tournament: ${tournament.cohort} ${tournament.name}`);

    const completedTournament = {
        ...tournament,
        startsAt: tournament.startsAt.replace('ACTIVE', 'COMPLETE'),
    };
    setWinners(completedTournament);

    await dynamo.send(
        new PutItemCommand({
            Item: marshall(completedTournament, { removeUndefinedValues: true }),
            TableName: tournamentsTable,
        })
    );

    await dynamo.send(
        new DeleteItemCommand({
            Key: {
                type: { S: tournament.type },
                startsAt: { S: tournament.startsAt },
            },
            TableName: tournamentsTable,
        })
    );

    const tournamentName = new Set([`${tournament.cohort} ${tournament.name}`]);
    for (const winner of completedTournament.winners ?? []) {
        try {
            const input = new UpdateItemBuilder()
                .key('username', winner)
                .add('roundRobinWins', tournamentName)
                .condition(attributeExists('username'))
                .table(usersTable)
                .build();
            await dynamo.send(input);
        } catch (err) {
            console.error(`Failed to set ${winner} as winner: `, err);
        }
    }

    await banPlayers(tournament);
}

/**
 * Sets the winners for the given tournament. Winners are determined by comparing
 * first the total score in the tournament and then their tiebreak score. If there
 * are still multiple tied users, they are all saved as winners.
 * @param tournament The tournament to set the winners for.
 */
async function setWinners(tournament: RoundRobin) {
    const playerStats = calculatePlayerStats(tournament);
    const topPlayers = Object.entries(playerStats)
        .sort((lhs, rhs) => {
            if (lhs[1].score === rhs[1].score) {
                return rhs[1].tiebreakScore - lhs[1].tiebreakScore;
            }
            return rhs[1].score - lhs[1].score;
        })
        .filter(
            (val, _, array) =>
                val[1].score === array[0][1].score &&
                val[1].tiebreakScore === array[0][1].tiebreakScore
        );

    if (!topPlayers[0]?.[1].score) {
        return;
    }

    tournament.winners = topPlayers.map(([username]) => username);
}

/**
 * Bans players who did not submit any games in the round robin.
 * @param tournament The tournament to ban players from.
 */
async function banPlayers(tournament: RoundRobin) {
    const playerStats = calculatePlayerStats(tournament);
    const bannedPlayers: RoundRobinPlayer[] = [];
    for (const player of Object.values(tournament.players)) {
        if (
            player.status === RoundRobinPlayerStatuses.ACTIVE &&
            !playerStats[player.username]?.played
        ) {
            bannedPlayers.push(player);
        }
    }
    if (bannedPlayers.length === 0) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('type', 'ROUND_ROBIN')
        .key('startsAt', 'BANNED_PLAYERS')
        .return('NONE')
        .table(tournamentsTable);
    for (const player of bannedPlayers) {
        input.set(['players', player.username], {
            ...player,
            updatedAt: new Date().toISOString(),
            tournament: `${tournament.cohort} ${tournament.name}`,
        });
    }
    await dynamo.send(input.build());
}
