import task from '@cypress/code-coverage/task';
import { defineConfig } from 'cypress';
import dotenv from 'dotenv';
import lockfile from 'proper-lockfile';
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
        setupNodeEvents(on, config) {
            task((_ignored, tasks) => {
                // we use our own locking here to prevent a race condition with cypress-coverage and
                // cypress-parallel
                const myTasks = {
                    ...tasks,
                    combineCoverage: async (sentCoverage: unknown) => {
                        const release = await lockfile.lock('.cypressCombineCoverage', {
                            realpath: false, // allows following symlinks and creating the file
                            retries: {
                                retries: 10,
                                factor: 2,
                                minTimeout: 100,
                                maxTimeout: 1000,
                                randomize: true,
                            },
                        });
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        const ret = await (tasks as any).combineCoverage(sentCoverage);
                        await release();
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return ret;
                    },
                    coverageReport: async () => {
                        const release = await lockfile.lock('.cypressCoverageReport', {
                            realpath: false, // allows following symlinks and creating the file
                            retries: {
                                retries: 10,
                                factor: 2,
                                minTimeout: 100,
                                maxTimeout: 1000,
                                randomize: true,
                            },
                        });
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
                        const ret = await (tasks as any).coverageReport();
                        await release();
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                        return ret;
                    },
                };
                on('task', myTasks);
            }, config);

            return config;
        },
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
        },
    }),
});
