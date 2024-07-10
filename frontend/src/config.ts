import { z } from 'zod';

export const EnvSchema = z.object({
    AUTH_REGION: z.literal('us-east-1'),
    AUTH_USER_POOL_ID: z.string(),
    AUTH_USER_POOL_WEB_CLIENT_ID: z.string(),
    AUTH_OAUTH_DOMAIN: z.string(),
    AUTH_OAUTH_SCOPES: z
        .string()
        .transform((value) => value.split(',').map((v) => v.trim()))
        .pipe(z.string().array()),
    AUTH_OAUTH_REDIRECT_SIGN_IN: z.string(),
    AUTH_OAUTH_REDIRECT_SIGN_OUT: z.string(),
    AUTH_OAUTH_RESPONSE_TYPE: z.literal('code'),
    API_BASE_URL: z.string(),
    MEDIA_PICTURES_BUCKET: z.string(),
    STRIPE_PUBLISHABLE_KEY: z.string(),
    CHAT_SERVER: z.string(),
    CHAT_CHANNEL: z.string(),
});

export interface Config {
    auth: {
        region: 'us-east-1';
        userPoolId: string;
        userPoolWebClientId: string;
        oauth: {
            domain: string;
            scope: string[];
            redirectSignIn: string;
            redirectSignOut: string;
            responseType: 'code';
        };
    };
    api: {
        baseUrl: string;
    };
    media: {
        picturesBucket: string;
    };
    stripe: {
        publishableKey: string;
    };
    chat: {
        server: string;
        channel: string;
    };
}

export function getConfig(): Config {
    const env = EnvSchema.parse(process.env);

    return {
        auth: {
            region: env.AUTH_REGION,
            userPoolId: env.AUTH_USER_POOL_ID,
            userPoolWebClientId: env.AUTH_USER_POOL_WEB_CLIENT_ID,
            oauth: {
                domain: env.AUTH_OAUTH_DOMAIN,
                scope: env.AUTH_OAUTH_SCOPES,
                redirectSignIn: env.AUTH_OAUTH_REDIRECT_SIGN_IN,
                redirectSignOut: env.AUTH_OAUTH_REDIRECT_SIGN_OUT,
                responseType: env.AUTH_OAUTH_RESPONSE_TYPE,
            },
        },
        api: {
            baseUrl: env.API_BASE_URL,
        },
        media: {
            picturesBucket: env.MEDIA_PICTURES_BUCKET,
        },
        stripe: {
            publishableKey: env.STRIPE_PUBLISHABLE_KEY,
        },
        chat: {
            server: env.CHAT_SERVER,
            channel: env.CHAT_CHANNEL,
        },
    };
}
