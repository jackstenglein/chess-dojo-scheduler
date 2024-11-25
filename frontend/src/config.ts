import { z } from 'zod';

export const MUI_LICENSE_KEY =
    'b63a52d106bd196a9b02ba316e6e9673Tz0xMDE1MjMsRT0xNzYyNzMwMDQ1MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=';

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
        roundRobinUrl: z.string(),
    }),
    media: z.object({
        picturesBucket: z.string(),
    }),
    stripe: z.object({
        publishableKey: z.string(),
        monthlyPriceId: z.string(),
        yearlyPriceId: z.string(),
    }),
    baseUrl: z.string(),
    isBeta: z.boolean(),
    metaPixelId: z.string(),
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
            roundRobinUrl: process.env.NEXT_PUBLIC_ROUND_ROBIN_API_ENDPOINT,
        },
        media: {
            picturesBucket: process.env.NEXT_PUBLIC_MEDIA_PICTURES_BUCKET,
        },
        stripe: {
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
            yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID,
        },
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        isBeta: process.env.NEXT_PUBLIC_IS_BETA === 'true',
        metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    });
}
