import { getConfig } from '@/config';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';

const config = getConfig();

export const { runWithAmplifyServerContext } = createServerRunner({
    config: {
        Auth: {
            Cognito: {
                userPoolId: config.auth.userPoolId,
                userPoolClientId: config.auth.userPoolWebClientId,
                loginWith: {
                    oauth: {
                        domain: config.auth.oauth.domain,
                        scopes: config.auth.oauth.scope,
                        redirectSignIn: [config.auth.oauth.redirectSignIn],
                        redirectSignOut: [config.auth.oauth.redirectSignOut],
                        responseType: config.auth.oauth.responseType,
                    },
                },
            },
        },
    },
});
