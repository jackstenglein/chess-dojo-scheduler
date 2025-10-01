import {
  API_DEV,
  API_TOKEN,
  PUBLIC_AUTH_REGION,
  PUBLIC_AUTH_USER_POOL_ID,
  PUBLIC_AUTH_USER_POOL_WEB_CLIENT_ID,
  PUBLIC_AUTH_OAUTH_DOMAIN,
  PUBLIC_AUTH_OAUTH_SCOPES,
  PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_IN,
  PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_OUT,
  PUBLIC_AUTH_OAUTH_RESPONSE_TYPE,
} from '@env';

export const BaseUrl = API_DEV;
export const BaseUrlWithToken = API_TOKEN;
export const awsConfig = {
  Auth: {
    Cognito: {
      region: PUBLIC_AUTH_REGION,
      userPoolId: PUBLIC_AUTH_USER_POOL_ID,
      userPoolClientId: PUBLIC_AUTH_USER_POOL_WEB_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: PUBLIC_AUTH_OAUTH_DOMAIN,
          scopes: PUBLIC_AUTH_OAUTH_SCOPES
            ? PUBLIC_AUTH_OAUTH_SCOPES.split(',')
            : [],
          redirectSignIn: PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_IN
            ? PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_IN.split(',')
            : [],
          redirectSignOut: PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_OUT
            ? PUBLIC_AUTH_OAUTH_REDIRECT_SIGN_OUT.split(',')
            : [],
          responseType: PUBLIC_AUTH_OAUTH_RESPONSE_TYPE,
        },
      },
    },
  },
};
