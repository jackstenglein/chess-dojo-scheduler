import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import fetch from 'node-fetch';
import {
    DiscordTokenResponse,
    DiscordUserResponse,
    addUserToGuild,
    DISCORD_TOKEN_URL,
    DISCORD_USER_URL,
    PaidCohortRoleId,
    FreeCohortRoleId,
    DISCORD_GUILD_PROD_ID,
    FreeUnVerifiedRole,
    removeUserFromGuild,
} from './discord';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Event received:', JSON.stringify(event));

    try {
        const mode = event.queryStringParameters?.mode;

        if (!mode) {
            return formatJSONResponse(400, { error: 'Invalid mode. Use ?mode=connect or ?mode=disconnect' });
        }

        if (!event.body) {
            throw new Error('Request body is missing');
        }

        const body = JSON.parse(event.body);

        const { code, ispaid: isPaid, cohort } = body;

        if (mode === "connect" && (!code || typeof isPaid !== 'boolean' || !cohort) ) {
            return formatJSONResponse(400, { error: 'Invalid body: code, ispaid, and cohort are required for ?mode=connect' });
        }

        if(mode === "disconnect" && !code){
          return formatJSONResponse(400, {error: 'Invalid body: code is required for ?mode=disconnect'})
        }

        const params = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID!,
            client_secret: process.env.DISCORD_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        });

        const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Token exchange failed:', errorData);
            return formatJSONResponse(400, { error: 'Failed to get access token', details: errorData });
        }

        const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;

        const userResponse = await fetch(DISCORD_USER_URL, {
          method: 'GET',
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userResponse.ok) {
          const errorData = await userResponse.json();
          console.error('User data fetch failed:', errorData);
          return formatJSONResponse(400, { error: 'Failed to fetch user data', details: errorData });
      }

      const userData = (await userResponse.json()) as DiscordUserResponse;

        if (mode === 'connect') {

            const roleId = isPaid ? PaidCohortRoleId[cohort] : FreeCohortRoleId[cohort];

            let rolesList = [roleId];

            if (!isPaid) {
                rolesList.push(FreeUnVerifiedRole);
            }

            if (!roleId) {
                throw new Error(`Invalid cohort: ${cohort}`);
            }

            const addedStatus = await addUserToGuild(
                DISCORD_GUILD_PROD_ID,
                userData.id,
                userData.username,
                tokenData.access_token,
                process.env.DISCORD_BOT_TOKEN!,
                rolesList,
            );

            return formatJSONResponse(200, {
                username: userData.username,
                verification: addedStatus,
            });
        } else if (mode === 'disconnect') {
            const removedStatus = await removeUserFromGuild(userData.id, DISCORD_GUILD_PROD_ID, process.env.DISCORD_BOT_TOKEN!);

            return formatJSONResponse(200, {
                disconnectstatus: removedStatus,
            });
        } else {
          return formatJSONResponse(400, { error: 'Invalid mode. Use ?mode=connect or ?mode=disconnect' });
        }
    } catch (err) {
        console.error('Error:', err);

        return formatJSONResponse(500, {
            error: 'Internal server error',
            message: err instanceof Error ? err.message : 'An unknown error occurred',
        });
    }
};

const formatJSONResponse = (statusCode: number, body: Record<string, unknown>): APIGatewayProxyResult => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(body),
    };
};
