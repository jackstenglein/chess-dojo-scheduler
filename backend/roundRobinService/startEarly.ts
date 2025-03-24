import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { dojoCohorts } from '@jackstenglein/chess-dojo-common/src/database/cohort';
import {
    MIN_ROUND_ROBIN_PLAYERS,
    RoundRobinWaitlist,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { ScheduledEvent } from 'aws-lambda';
import { ApiError } from 'chess-dojo-directory-service/api';
import { dynamo } from 'chess-dojo-directory-service/database';
import { startTournament, tournamentsTable } from './register';

/**
 * Handles a CloudWatch cron job to list all round robin waitlists
 * and start any that have not been updated in 10 days and have >=4
 * players.
 * @param event The scheduled event that triggered the handler.
 */
export const handler = async (event: ScheduledEvent) => {
    console.log('Event: %j', event);
    for (const cohort of dojoCohorts) {
        try {
            await processCohort(cohort);
        } catch (err) {
            console.error('Failed to process cohort: ', cohort, err);
        }
    }
};

/**
 * Fetches the waitlist for the given cohort and starts the tournament
 * if necessary.
 * @param cohort The cohort to check.
 */
async function processCohort(cohort: string) {
    const output = await dynamo.send(
        new GetItemCommand({
            Key: {
                type: { S: `ROUND_ROBIN_${cohort}` },
                startsAt: { S: 'WAITING' },
            },
            TableName: tournamentsTable,
        })
    );
    if (!output.Item) {
        throw new ApiError({ statusCode: 404, publicMessage: `Cohort ${cohort} not found` });
    }

    const waitlist = unmarshall(output.Item) as RoundRobinWaitlist;
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    if (
        Object.keys(waitlist.players).length >= MIN_ROUND_ROBIN_PLAYERS &&
        waitlist.updatedAt <= tenDaysAgo.toISOString()
    ) {
        console.log(`Starting tournament for ${cohort}: `, waitlist);
        await startTournament(waitlist);
    }
}
