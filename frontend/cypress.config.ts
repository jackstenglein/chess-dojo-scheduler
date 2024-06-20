import task from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import { EnvSchema } from './cypress/env';

dotenv.config({ path: '.env.test.local' });

export default defineConfig({
    projectId: 'ut1fmk',

    e2e: {
        baseUrl: 'http://localhost:3000',
        experimentalRunAllSpecs: true,
        setupNodeEvents(on, config) {
            task(on, config);
            return config;
        },
    },

    env: EnvSchema.strict().parse({
        apiBaseUrl: 'https://c2qamdaw08.execute-api.us-east-1.amazonaws.com',
        numCohorts: 23,

        cognito_username: process.env.AWS_COGNITO_USERNAME,
        cognito_password: process.env.AWS_COGNITO_PASSWORD,
        cognito_region: process.env.AWS_COGNITO_REGION,
        cognito_user_pool_id: process.env.AWS_COGNITO_USER_POOL_ID,
        cognito_user_pool_web_client_id: process.env.AWS_COGNITO_USER_POOL_WEB_CLIENT_ID,
        cognito_domain: process.env.AWS_COGNITO_DOMAIN,

        codeCoverage: {
            exclude: 'cypress/**/*.*',
        },
    }),
});
