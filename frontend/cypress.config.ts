import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test.local' });

export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        baseUrl: 'http://localhost:3000',
    },

    env: {
        cognito_username: process.env.AWS_COGNITO_USERNAME,
        cognito_password: process.env.AWS_COGNITO_PASSWORD,
        cognito_region: process.env.AWS_COGNITO_REGION,
        cognito_user_pool_id: process.env.AWS_COGNITO_USER_POOL_ID,
        cognito_user_pool_web_client_id: process.env.AWS_COGNITO_USER_POOL_WEB_CLIENT_ID,
        cognito_domain: process.env.AWS_COGNITO_DOMAIN,
    },
});
