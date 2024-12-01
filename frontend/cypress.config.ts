// import task from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import { EnvSchema } from './cypress/env';

dotenv.config({
    path: ['.env.test.local', '.env.local', '.env.test', '.env'],
});

const env = process.env;

export default defineConfig({
    projectId: 'ut1fmk',

    e2e: {
        baseUrl: 'http://localhost:3000',
        experimentalRunAllSpecs: true,
    },

    env: EnvSchema.strict().parse({
        apiBaseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
        numCohorts: 23,

        cognito_username: env.AWS_COGNITO_USERNAME,
        cognito_password: env.AWS_COGNITO_PASSWORD,
        cognito_region: env.NEXT_PUBLIC_AUTH_REGION,
        cognito_user_pool_id:
            env.AWS_COGNITO_USER_POOL_ID ?? env.NEXT_PUBLIC_AUTH_USER_POOL_ID,
        cognito_user_pool_web_client_id:
            env.AWS_COGNITO_USER_POOL_WEB_CLIENT_ID ??
            env.NEXT_PUBLIC_AUTH_USER_POOL_WEB_CLIENT_ID,
        cognito_domain:
            env.AWS_COGNITO_DOMAIN ?? process.env.NEXT_PUBLIC_AUTH_OAUTH_DOMAIN,

        codeCoverage: {
            exclude: 'cypress/**/*.*',
            url: 'http://localhost:3000/api/__coverage__',
        },
    }),

    retries: {
        runMode: 2,
    },
});
