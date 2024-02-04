'use strict';

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import {
    APIGatewayProxyEvent,
    APIGatewayProxyHandler,
    APIGatewayProxyResult,
} from 'aws-lambda';
import { Chess } from '@jackstenglein/chess';

const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });

const MIN_ROUND = 1;
const MAX_ROUND = 7;

const usersTable = process.env.stage + '-users';
const tournamentsTable = process.env.stage + '-tournaments';

interface UserInfo {
    username: string;
    email: string;
}

interface PutPairingsRequest {
    closeRegistrations: boolean;
    region: string;
    section: string;
    round: number;
    pgnData: string;
}

interface OpenClassicalPlayer {
    lichessUsername: string;
    discordUsername: string;
    title: string;
    rating: number;
}

interface OpenClassicalPairing {
    white: OpenClassicalPlayer;
    black: OpenClassicalPlayer;
    result: string;
    verified: boolean;
}

interface OpenClassicalRound {
    pairings: OpenClassicalPairing[];
}

interface OpenClassical {
    acceptingRegistrations: boolean;
    sections: Record<string, OpenClassicalSection>;
}

interface OpenClassicalSection {
    rounds: OpenClassicalRound[];
}

function handleError(code: number, err: any): APIGatewayProxyResult {
    console.error(err);

    return {
        statusCode: code,
        isBase64Encoded: false,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(err),
    };
}

function getUserInfo(event: APIGatewayProxyEvent): UserInfo {
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    if (!claims) {
        return {
            username: '',
            email: '',
        };
    }

    return {
        username: claims['cognito:username'] || '',
        email: claims['email'] || '',
    };
}

function getUsernames(playerName: string): [string, string] {
    const tokens = playerName.split(',discord:');
    const lichessUsername = tokens[0].replace('lichess:', '');
    const discordUsername = tokens.length > 1 ? tokens[1] : '';

    return [lichessUsername, discordUsername];
}

function getPairing(chess: Chess): OpenClassicalPairing {
    const [whiteLichess, whiteDiscord] = getUsernames(chess.header().White);
    const [blackLichess, blackDiscord] = getUsernames(chess.header().Black);
    const whiteRating = chess.header().WhiteElo ? parseInt(chess.header().WhiteElo) : 0;
    const blackRating = chess.header().BlackElo ? parseInt(chess.header().BlackElo) : 0;

    return {
        white: {
            lichessUsername: whiteLichess,
            discordUsername: whiteDiscord,
            title: chess.header().WhiteTitle || '',
            rating: whiteRating,
        },
        black: {
            lichessUsername: blackLichess,
            discordUsername: blackDiscord,
            title: chess.header().BlackTitle || '',
            rating: blackRating,
        },
        result: chess.header().Result || '',
        verified: chess.header().Result !== '' && chess.header().Result !== '*',
    };
}

function getPairings(request: PutPairingsRequest): OpenClassicalPairing[] {
    const result: OpenClassicalPairing[] = [];

    const pgns = request.pgnData.split('\n\n*\n\n');
    for (const pgn of pgns) {
        if (pgn.trim().length === 0) {
            continue;
        }
        console.log('Parsing PGN: ', pgn);
        const chess = new Chess({ pgn });
        result.push(getPairing(chess));
    }

    console.log('Got Pairings: ', result);
    return result;
}

export const handler: APIGatewayProxyHandler = async (event, _) => {
    console.log('Event: %j', event);

    const userInfo = getUserInfo(event);
    if (!userInfo.username) {
        return handleError(400, {
            publicMessage: 'Invalid request: username is required',
        });
    }

    let getItemOutput = await dynamoDB.send(
        new GetItemCommand({
            Key: {
                username: { S: userInfo.username },
            },
            TableName: usersTable,
        })
    );
    if (!getItemOutput.Item) {
        return handleError(404, { publicMessage: 'Invalid request: user not found' });
    }

    const caller = unmarshall(getItemOutput.Item);
    if (!caller.isAdmin && !caller.isTournamentAdmin) {
        return handleError(403, {
            publicMessage: 'Invalid request: user is not admin or tournament admin',
        });
    }

    getItemOutput = await dynamoDB.send(
        new GetItemCommand({
            Key: { type: { S: 'OPEN_CLASSICAL' }, startsAt: { S: 'CURRENT' } },
            TableName: tournamentsTable,
        })
    );
    if (!getItemOutput.Item) {
        return handleError(404, {
            publicMessage: 'Invalid request: open classical not found',
        });
    }

    const openClassical = unmarshall(getItemOutput.Item) as OpenClassical;

    const request: PutPairingsRequest = JSON.parse(event.body || '');
    if (request.closeRegistrations) {
        openClassical.acceptingRegistrations = false;

        await dynamoDB.send(
            new PutItemCommand({
                Item: marshall(openClassical),
                TableName: tournamentsTable,
            })
        );

        const result: APIGatewayProxyResult = {
            statusCode: 200,
            body: JSON.stringify(openClassical),
        };
        return result;
    }

    if (!request.region) {
        return handleError(400, {
            publicMessage: `Invalid request: region is required`,
        });
    }
    if (!request.section) {
        return handleError(400, {
            publicMessage: `Invalid request: section is required`,
        });
    }
    if (request.round < MIN_ROUND || request.round > MAX_ROUND) {
        return handleError(400, {
            publicMessage: `Invalid request: round must be between ${MIN_ROUND} and ${MAX_ROUND}`,
        });
    }
    if (!request.pgnData) {
        return handleError(400, {
            publicMessage: 'Invalid request: pgnData cannot be empty',
        });
    }

    const section = openClassical.sections[`${request.region}_${request.section}`];
    if (!section) {
        return handleError(400, {
            publicMessage: `Invalid request: region ${request.region} and section ${request.section} not found`,
        });
    }

    const pairings = getPairings(request);
    if (pairings.length === 0) {
        return handleError(400, {
            publicMessage: 'Invalid request: no pairings could be parsed from PGN',
        });
    }

    if (!section.rounds) {
        section.rounds = [];
    }
    const length = section.rounds.length;
    if (length < request.round - 1) {
        return handleError(400, {
            publicMessage: `Invalid request: request is for round ${
                request.round
            } but next round is ${length + 1}`,
        });
    }

    if (length < request.round) {
        section.rounds.push({ pairings });
    } else {
        section.rounds[request.round - 1] = { pairings };
    }

    console.log('Setting openClassical: ', openClassical);

    await dynamoDB.send(
        new PutItemCommand({
            Item: marshall(openClassical),
            TableName: tournamentsTable,
        })
    );

    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: JSON.stringify(openClassical),
    };
    return result;
};
