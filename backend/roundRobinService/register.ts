'use strict';

import {
    ConditionalCheckFailedException,
    GetItemCommand,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { NotificationEventTypes } from '@jackstenglein/chess-dojo-common/src/database/notification';
import { SubscriptionStatus, User } from '@jackstenglein/chess-dojo-common/src/database/user';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    MIN_ROUND_ROBIN_PLAYERS,
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
import Stripe from 'stripe';
import { getSecret } from './secret';

const sqs = new SQSClient({ region: 'us-east-1' });
export const tournamentsTable = process.env.stage + '-tournaments';
const usersTable = process.env.stage + '-users';
const MAX_ATTEMPTS = 3;
const FRONTEND_HOST = process.env.frontendHost;

let stripe: Stripe | undefined = undefined;

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
        const user = await fetchUser(username);

        if (user.subscriptionStatus !== SubscriptionStatus.Subscribed) {
            const url = await getCheckoutUrl({ user, request });
            return success({ url });
        }

        const tournaments = await register({ username, request });
        return success(tournaments);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Fetches the user with the given username.
 * @param username The username to fetch.
 * @returns The user with the given username.
 */
async function fetchUser(username: string): Promise<User> {
    const result = await dynamo.send(
        new GetItemCommand({
            Key: {
                username: { S: username },
            },
            TableName: usersTable,
        })
    );
    if (!result.Item) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: `Invalid request: user ${username} does not exist`,
        });
    }
    return unmarshall(result.Item) as User;
}

/**
 * Initializes Stripe using the current stage's key.
 * @returns The new Stripe object.
 */
async function initStripe(): Promise<Stripe> {
    return new Stripe((await getSecret(`chess-dojo-${process.env.stage}-stripeKey`)) || '');
}

/**
 * Creates and returns a Stripe checkout URL in setup mode.
 * @param user The user being redirected to Stripe.
 * @param request The round robin register request.
 * @returns The Stripe checkout URL.
 */
async function getCheckoutUrl({
    user,
    request,
}: {
    user: User;
    request: RoundRobinRegisterRequest;
}): Promise<string> {
    if (!stripe) {
        stripe = await initStripe();
    }

    const session = await stripe.checkout.sessions.create({
        client_reference_id: user.username,
        customer: user.paymentInfo?.customerId,
        customer_creation: user.paymentInfo?.customerId ? undefined : 'always',
        mode: 'setup',
        payment_method_types: ['card', 'cashapp', 'link', 'bancontact', 'ideal', 'sepa_debit'],
        custom_text: {
            after_submit: {
                message:
                    'ChessDojo will charge you $2 once the Round Robin tournament begins. Withdraw before the tournament starts for free. After the tournament starts, no refunds will be provided.',
            },
        },
        success_url: `${FRONTEND_HOST}/tournaments/round-robin?cohort=${request.cohort}`,
        cancel_url: `${FRONTEND_HOST}/tournaments/round-robin?cohort=${request.cohort}`,
        metadata: {
            type: 'ROUND_ROBIN',
            username: user.username,
            displayName: request.displayName,
            lichessUsername: request.lichessUsername,
            chesscomUsername: request.chesscomUsername,
            discordUsername: request.discordUsername || '',
            cohort: request.cohort,
        },
    });
    console.log('Session: %j', session);

    if (!session.url) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: `Stripe checkout session does not have URL: ${session}`,
        });
    }
    return session.url;
}

/**
 * Registers the given user for the given round robin.
 * @param username The username of the person registering.
 * @param request The round robin registration request.
 * @param checkoutSession The Stripe checkout session for users who paid to enter.
 * @returns An array of the updated tournament and waitlist.
 */
export async function register({
    username,
    request,
    checkoutSession,
}: {
    username: string;
    request: RoundRobinRegisterRequest;
    checkoutSession?: Stripe.Checkout.Session;
}): Promise<{ waitlist: RoundRobinWaitlist; tournament?: RoundRobin }> {
    const player: RoundRobinPlayer = {
        username,
        displayName: request.displayName,
        lichessUsername: request.lichessUsername,
        chesscomUsername: request.chesscomUsername,
        discordUsername: request.discordUsername,
        status: RoundRobinPlayerStatuses.ACTIVE,
        checkoutSession: checkoutSession as { setup_intent: string; customer: string },
    };

    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
        try {
            const input = new UpdateItemBuilder()
                .key('type', `ROUND_ROBIN_${request.cohort}`)
                .key('startsAt', 'WAITING')
                .set(['players', username], player)
                .set('updatedAt', new Date().toISOString())
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
            const waitlist = unmarshall(result.Attributes!) as RoundRobinWaitlist;

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
export async function startTournament(
    waitlist: RoundRobinWaitlist
): Promise<{ waitlist: RoundRobinWaitlist; tournament: RoundRobin }> {
    if (Object.keys(waitlist.players).length < MIN_ROUND_ROBIN_PLAYERS) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Temporary server error',
            privateMessage: `Waitlist does not have at least ${MIN_ROUND_ROBIN_PLAYERS} players: ${waitlist}`,
        });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);

    const tournament = {
        ...waitlist,
        startsAt: `ACTIVE_${startDate.toISOString()}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        name: generateName(startDate, waitlist.name),
        updatedAt: new Date().toISOString(),
    } as RoundRobin;
    setPairings(tournament);

    await dynamo.send(
        new PutItemCommand({
            Item: marshall(tournament, { removeUndefinedValues: true }),
            TableName: tournamentsTable,
        })
    );

    waitlist.players = {};
    waitlist.name = `${parseInt(waitlist.name) + 1}`;
    waitlist.updatedAt = new Date().toISOString();
    await dynamo.send(
        new PutItemCommand({
            Item: marshall(waitlist, { removeUndefinedValues: true }),
            TableName: tournamentsTable,
        })
    );

    await chargeFreeUsers(tournament);
    await sendRoundRobinStartEvent(tournament);
    return { tournament, waitlist };
}

/**
 * Charges the free users in the given tournament.
 * @param tournament The tournament to charge free users for.
 */
async function chargeFreeUsers(tournament: RoundRobin) {
    for (const player of Object.values(tournament.players)) {
        if (!player.checkoutSession?.setup_intent) {
            continue;
        }

        try {
            if (!stripe) {
                stripe = await initStripe();
            }
            const setupIntent = await stripe.setupIntents.retrieve(
                player.checkoutSession.setup_intent
            );
            await stripe.paymentIntents.create({
                amount: 200,
                currency: 'usd',
                customer: player.checkoutSession.customer ?? undefined,
                payment_method: setupIntent.payment_method as string,
                off_session: true,
                confirm: true,
                statement_descriptor: 'CHESSDOJO ROUND ROBIN',
            });
        } catch (err) {
            console.error(`Failed to charge player %j: %j`, player, err);
        }
    }
}

/**
 * Sends a round robin start event to SQS to process notifications
 * for the tournament starting.
 * @param tournament The tournament that has started.
 */
async function sendRoundRobinStartEvent(tournament: RoundRobin) {
    await sqs.send(
        new SendMessageCommand({
            QueueUrl: process.env.notificationEventSqsUrl,
            MessageBody: JSON.stringify({
                type: NotificationEventTypes.ROUND_ROBIN_START,
                tournament,
            }),
        })
    );
}

/**
 * Generates a round robin tournament name based on the start date.
 * @param startDate The start date of the tournament.
 * @returns The generated name.
 */
function generateName(startDate: Date, number: string) {
    const month = startDate.getUTCMonth() + 1;
    const year = startDate.getUTCFullYear();

    if (month >= 12 || month <= 2) {
        // Dec - Feb
        return `Winter ${year} #${number}`;
    }
    if (month <= 5) {
        // March - May
        return `Spring ${year} #${number}`;
    }
    if (month <= 8) {
        // June - Aug
        return `Summer ${year} #${number}`;
    }
    // Sept - Nov
    return `Fall ${year} #${number}`;
}

/**
 * Generates the pairings using Berger tables and sets it on the
 * given tournament.
 * See https://handbook.fide.com/chapter/C05Annex1.
 * @param tournament The tournament to generate and set pairings for.
 */
function setPairings(tournament: RoundRobin) {
    const players = Object.keys(tournament.players);
    const pairings: RoundRobinPairing[][] = [];

    let bergerTable: number[][][];
    if (players.length <= 4) {
        bergerTable = bergerTable4;
    } else if (players.length <= 6) {
        bergerTable = bergerTable5or6;
    } else if (players.length <= 8) {
        bergerTable = bergerTable7or8;
    } else {
        bergerTable = bergerTable9or10;
    }

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
const bergerTable4 = [
    [
        [0, 3],
        [1, 2],
    ],
    [
        [3, 2],
        [0, 1],
    ],
    [
        [1, 3],
        [2, 0],
    ],
];
const bergerTable5or6 = [
    [
        [0, 5],
        [1, 4],
        [2, 3],
    ],
    [
        [5, 3],
        [4, 2],
        [0, 1],
    ],
    [
        [1, 5],
        [2, 0],
        [3, 4],
    ],
    [
        [5, 4],
        [0, 3],
        [1, 2],
    ],
    [
        [2, 5],
        [3, 1],
        [4, 0],
    ],
];
const bergerTable7or8 = [
    [
        [0, 7],
        [1, 6],
        [2, 5],
        [3, 4],
    ],
    [
        [7, 4],
        [5, 3],
        [6, 2],
        [0, 1],
    ],
    [
        [1, 7],
        [2, 0],
        [3, 6],
        [4, 5],
    ],
    [
        [7, 5],
        [6, 4],
        [0, 3],
        [1, 2],
    ],
    [
        [2, 7],
        [3, 1],
        [4, 0],
        [5, 6],
    ],
    [
        [7, 6],
        [0, 5],
        [1, 4],
        [2, 3],
    ],
    [
        [3, 7],
        [4, 2],
        [5, 1],
        [6, 0],
    ],
];
const bergerTable9or10 = [
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
