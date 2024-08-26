import { z } from 'zod';

export const EnvSchema = z.object({
    auth: z.object({
        region: z.literal('us-east-1'),
        userPoolId: z.string(),
        userPoolWebClientId: z.string(),
        oauth: z.object({
            domain: z.string(),
            scope: z
                .string()
                .transform((value) => value.split(',').map((v) => v.trim()))
                .pipe(z.string().array()),
            redirectSignIn: z.string(),
            redirectSignOut: z.string(),
            responseType: z.literal('code'),
        }),
    }),
    api: z.object({
        baseUrl: z.string(),
    }),
    media: z.object({
        picturesBucket: z.string(),
    }),
    stripe: z.object({
        publishableKey: z.string(),
    }),
    baseUrl: z
        .string()
        .url()
        .transform((v) => new URL(v)),
    isBeta: z.boolean(),
});

export type Config = z.infer<typeof EnvSchema>;

export function getConfig(): Config {
    return EnvSchema.parse({
        auth: {
            region: process.env.NEXT_PUBLIC_AUTH_REGION,
            userPoolId: process.env.NEXT_PUBLIC_AUTH_USER_POOL_ID,
            userPoolWebClientId: process.env.NEXT_PUBLIC_AUTH_USER_POOL_WEB_CLIENT_ID,
            oauth: {
                domain: process.env.NEXT_PUBLIC_AUTH_OAUTH_DOMAIN,
                scope: process.env.NEXT_PUBLIC_AUTH_OAUTH_SCOPES,
                redirectSignIn: process.env.NEXT_PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_IN,
                redirectSignOut: process.env.NEXT_PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_OUT,
                responseType: process.env.NEXT_PUBLIC_AUTH_OAUTH_RESPONSE_TYPE,
            },
        },
        api: {
            baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        },
        media: {
            picturesBucket: process.env.NEXT_PUBLIC_MEDIA_PICTURES_BUCKET,
        },
        stripe: {
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        },
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        isBeta: process.env.NEXT_PUBLIC_IS_BETA === 'true',
    });
}
