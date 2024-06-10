import { CognitoUser } from '@aws-amplify/auth';
import { Amplify, Auth } from 'aws-amplify';

Amplify.configure({
    Auth: {
        region: cy.dojo.env('cognito_region'),
        userPoolId: cy.dojo.env('cognito_user_pool_id'),
        userPoolWebClientId: cy.dojo.env('cognito_user_pool_web_client_id'),
        oauth: {
            domain: cy.dojo.env('cognito_domain'),
            scope: ['profile', 'email', 'openid'],
            redirectSignIn: Cypress.config('baseUrl'),
            redirectSignOut: Cypress.config('baseUrl'),
            responseType: 'code',
        },
    },
});

type CognitoUserWithInternals = CognitoUser & {
    username: string;
    keyPrefix: string;
};

interface HasClockDrift {
    // Was treated like a string by the code, but should be a number
    clockDrift: number | string;
}

function isCognitoUser(resp: unknown): resp is CognitoUserWithInternals {
    return resp instanceof CognitoUser;
}

function isHasClockDrift(session: unknown): session is HasClockDrift {
    return !!session && typeof session === 'object' && 'clockDrift' in session;
}

const loginToCognito = (email: string, password: string) => {
    const log = Cypress.log({
        displayName: 'COGNITO LOGIN',
        message: [`Authenticating ${email}`],
        autoEnd: false,
    });

    log.snapshot('before');

    const signIn = Auth.signIn(email, password);

    cy.wrap(signIn, { log: false }).then((cognitoResponse) => {
        if (!isCognitoUser(cognitoResponse)) {
            throw new Error(
                `Unexpected response from Auth.signIn. Expected CognitoUser, got ${typeof cognitoResponse}`,
            );
        }

        const user = cognitoResponse;
        const userSession = user.getSignInUserSession();
        if (!isHasClockDrift(userSession)) {
            throw new Error(
                `Unexpected response from Auth.signIn. Expected CognitoUserSession to have clockDrift`,
            );
        }

        const idToken = userSession.getIdToken();
        const refreshToken = userSession.getRefreshToken();
        const accessToken = userSession.getAccessToken();

        const { username, keyPrefix } = user;

        const keyPrefixWithUsername = `${keyPrefix}.${username}`;
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.idToken`,
            idToken.getJwtToken(),
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.accessToken`,
            accessToken.getJwtToken(),
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.refreshToken`,
            refreshToken.getToken(),
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.clockDrift`,
            userSession.clockDrift.toString(),
        );
        window.localStorage.setItem(`${keyPrefix}.LastAuthUser`, username);

        window.localStorage.setItem('amplify-authenticator-authState', 'signedIn');

        log.snapshot('after');
        log.end();
    });
};

Cypress.Commands.add('loginByCognitoApi', (sessionId, email, password) => {
    cy.session(
        `${sessionId}-${email}`,
        () => {
            loginToCognito(email, password);
        },
        {
            validate() {
                cy.visit('/');

                cy.location('pathname').should('equal', '/profile');
            },
        },
    );
    cy.visit('/');
});
