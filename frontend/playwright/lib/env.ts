/**
 * Typed environment variables for Playwright tests.
 * Mirrors the Cypress env.ts structure.
 */
export const env = {
    /** Base URL for API requests */
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',

    /** Number of cohorts in the system */
    numCohorts: parseInt(process.env.NUM_COHORTS ?? '23', 10),

    /** Cognito configuration */
    cognitoRegion: process.env.COGNITO_REGION ?? '',
    cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    cognitoUserPoolWebClientId: process.env.COGNITO_USER_POOL_WEB_CLIENT_ID ?? '',
    cognitoDomain: process.env.COGNITO_DOMAIN ?? '',

    /** Test user credentials */
    cognitoUsername: process.env.AWS_COGNITO_USERNAME ?? '',
    cognitoPassword: process.env.AWS_COGNITO_PASSWORD ?? '',

    /** Test username */
    dojoUsername: process.env.TEST_DOJO_USERNAME ?? '',
};

/**
 * Get a typed environment variable.
 * Throws if the variable is required but not set.
 */
export function getEnv<K extends keyof typeof env>(name: K): (typeof env)[K] {
    const value = env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
