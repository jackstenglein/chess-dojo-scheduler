'use strict';

import {
    ConditionalCheckFailedException,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    RoundRobin,
    RoundRobinPairing,
    RoundRobinPlayer,
    RoundRobinPlayerStatuses,
    RoundRobinRegisterRequest,
    RoundRobinRegisterSchema,
    RoundRobinWaitlist,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parseEvent,
    requireUserInfo,
    success,
} from 'chess-dojo-directory-service/api';
import {
    and,
    attributeExists,
    attributeNotExists,
    dynamo,
    sizeLessThan,
    UpdateItemBuilder,
} from 'chess-dojo-directory-service/database';
import { v4 as uuid } from 'uuid';

export const tournamentsTable = process.env.stage + '-tournaments';
const MAX_ATTEMPTS = 3;

/**
 * Handles a request to register for the round robin. If the round robin
 * does not have enough registrations, the user is added to the waitlist.
 * If this registration causes the tournament to reach the max number of
 * players, the tournament is started and the waitlist is reset.
 * @param event The API gateway event that triggered the request.
 * @returns The updated tournament and waitlist.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);
        const request = parseEvent(event, RoundRobinRegisterSchema);
        const { username } = requireUserInfo(event);
        const tournaments = await register({ username, request });
        return success(tournaments);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Registers the given user for the given round robin.
 * @param username The username of the person registering.
 * @param request The round robin registration request.
 * @returns An array of the updated tournament and waitlist.
 */
async function register({
    username,
    request,
}: {
    username: string;
    request: RoundRobinRegisterRequest;
}): Promise<{ waitlist: RoundRobinWaitlist; tournament?: RoundRobin }> {
    const player: RoundRobinPlayer = {
        username,
        displayName: request.displayName,
        lichessUsername: request.lichessUsername,
        chesscomUsername: request.chesscomUsername,
        discordUsername: request.discordUsername,
        status: RoundRobinPlayerStatuses.ACTIVE,
    };

    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
        try {
            const input = new UpdateItemBuilder()
                .key('type', `ROUND_ROBIN_${request.cohort}`)
                .key('startsAt', 'WAITING')
                .set(['players', username], player)
                .condition(
                    and(
                        attributeExists('players'),
                        attributeNotExists(['players', username]),
                        sizeLessThan('players', MAX_ROUND_ROBIN_PLAYERS)
                    )
                )
                .table(tournamentsTable)
                .return('ALL_NEW')
                .build();

            console.log('Input: %j', input);

            const result = await dynamo.send(input);
            const waitlist = unmarshall(result.Attributes!) as RoundRobin;

            if (Object.keys(waitlist.players).length >= MAX_ROUND_ROBIN_PLAYERS) {
                return startTournament(waitlist);
            }

            return { waitlist };
        } catch (err) {
            if (err instanceof ConditionalCheckFailedException) {
                attempts++;
            } else {
                throw err;
            }
        }
    }

    throw new ApiError({
        statusCode: 500,
        publicMessage: 'Temporary server error',
        privateMessage: 'Exhausted max retries while conditional check failed',
    });
}

/**
 * Converts the given waitlist into an active tournament. After the tournament
 * is started, the waitlist is emptied to allow additional registrations.
 * @param waitlist The waitlist to convert.
 * @returns The new tournament as well as the waitlist.
 */
async function startTournament(
    waitlist: RoundRobin
): Promise<{ waitlist: RoundRobinWaitlist; tournament: RoundRobin }> {
    if (Object.keys(waitlist.players).length !== MAX_ROUND_ROBIN_PLAYERS) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: `Waitlist does not have ${MAX_ROUND_ROBIN_PLAYERS} players: ${waitlist}`,
        });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    const tournament: RoundRobin = {
        ...waitlist,
        startsAt: `ACTIVE_${startDate.toISOString()}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        name: generateName(startDate),
    };
    setPairings(tournament);

    await dynamo.send(
        new PutItemCommand({
            Item: marshall(tournament, { removeUndefinedValues: true }),
            TableName: tournamentsTable,
        })
    );

    waitlist.players = {};
    await dynamo.send(
        new PutItemCommand({
            Item: marshall(waitlist, { removeUndefinedValues: true }),
            TableName: tournamentsTable,
        })
    );

    return { tournament, waitlist };
}

/**
 * Generates a round robin tournament name based on the start date.
 * @param startDate The start date of the tournament.
 * @returns The generated name.
 */
function generateName(startDate: Date) {
    const month = startDate.getUTCMonth() + 1;
    const year = startDate.getUTCFullYear();
    const id = uuid().slice(-5);

    if (month >= 12 || month <= 2) {
        // Dec - Feb
        return `Winter ${year} ${id}`;
    }
    if (month <= 5) {
        // March - May
        return `Spring ${year} ${id}`;
    }
    if (month <= 8) {
        // June - Aug
        return `Summer ${year} ${id}`;
    }
    // Sept - Nov
    return `Fall ${year} ${id}`;
}

/**
 * Generates the pairings using the Berger table for 10 players
 * and sets it on the given tournament.
 * See https://handbook.fide.com/chapter/C05Annex1.
 * @param tournament The tournament to generate and set pairings for.
 */
function setPairings(tournament: RoundRobin) {
    const players = Object.keys(tournament.players);
    const pairings: RoundRobinPairing[][] = [];

    for (const round of bergerTable) {
        const roundPairings: RoundRobinPairing[] = [];
        for (const [whiteIdx, blackIdx] of round) {
            roundPairings.push({
                white: players[whiteIdx],
                black: players[blackIdx],
            });
        }
        pairings.push(roundPairings);
    }

    tournament.playerOrder = players;
    tournament.pairings = pairings;
}

// See https://handbook.fide.com/chapter/C05Annex1
const bergerTable = [
    [
        [0, 9],
        [1, 8],
        [2, 7],
        [3, 6],
        [4, 5],
    ],
    [
        [9, 5],
        [6, 4],
        [7, 3],
        [8, 2],
        [0, 1],
    ],
    [
        [1, 9],
        [2, 0],
        [3, 8],
        [4, 7],
        [5, 6],
    ],
    [
        [9, 6],
        [7, 5],
        [8, 4],
        [0, 3],
        [1, 2],
    ],
    [
        [2, 9],
        [3, 1],
        [4, 0],
        [5, 8],
        [6, 7],
    ],
    [
        [9, 7],
        [8, 6],
        [0, 5],
        [1, 4],
        [2, 3],
    ],
    [
        [3, 9],
        [4, 2],
        [5, 1],
        [6, 0],
        [7, 8],
    ],
    [
        [9, 8],
        [0, 7],
        [1, 6],
        [2, 5],
        [3, 4],
    ],
    [
        [4, 9],
        [5, 3],
        [6, 2],
        [7, 1],
        [8, 0],
    ],
];
