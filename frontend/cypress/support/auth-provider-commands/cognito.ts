import { Amplify, Auth } from 'aws-amplify';

Amplify.configure({
    Auth: {
        region: Cypress.env('cognito_region'),
        userPoolId: Cypress.env('cognito_user_pool_id'),
        userPoolWebClientId: Cypress.env('cognito_user_pool_web_client_id'),
        oauth: {
            domain: Cypress.env('cognito_domain'),
            scope: ['profile', 'email', 'openid'],
            redirectSignIn: Cypress.config('baseUrl'),
            redirectSignOut: Cypress.config('baseUrl'),
            responseType: 'code',
        },
    },
});

const loginToCognito = (email: string, password: string) => {
    const log = Cypress.log({
        displayName: 'COGNITO LOGIN',
        message: [`Authenticating ${email}`],
        autoEnd: false,
    });

    log.snapshot('before');

    const signIn = Auth.signIn(email, password);

    cy.wrap(signIn, { log: false }).then((cognitoResponse: any) => {
        const keyPrefixWithUsername = `${cognitoResponse.keyPrefix}.${cognitoResponse.username}`;
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.idToken`,
            cognitoResponse.signInUserSession.idToken.jwtToken
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.accessToken`,
            cognitoResponse.signInUserSession.accessToken.jwtToken
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.refreshToken`,
            cognitoResponse.signInUserSession.refreshToken.token
        );
        window.localStorage.setItem(
            `${keyPrefixWithUsername}.clockDrift`,
            cognitoResponse.signInUserSession.clockDrift
        );
        window.localStorage.setItem(
            `${cognitoResponse.keyPrefix}.LastAuthUser`,
            cognitoResponse.username
        );

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
        }
    );
    cy.visit('/');
});
