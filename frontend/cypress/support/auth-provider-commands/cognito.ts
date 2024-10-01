import { Amplify } from 'aws-amplify';
import { signIn } from 'aws-amplify/auth';

Amplify.configure(
    {
        Auth: {
            Cognito: {
                userPoolId: cy.dojo.env('cognito_user_pool_id'),
                userPoolClientId: cy.dojo.env('cognito_user_pool_web_client_id'),
                loginWith: {
                    oauth: {
                        domain: cy.dojo.env('cognito_domain'),
                        scopes: ['profile', 'email', 'openid'],
                        redirectSignIn: [Cypress.config('baseUrl') ?? ''],
                        redirectSignOut: [Cypress.config('baseUrl') ?? ''],
                        responseType: 'code',
                    },
                },
            },
        },
    },
    { ssr: true },
);

const loginToCognito = (email: string, password: string) => {
    const log = Cypress.log({
        displayName: 'COGNITO LOGIN',
        message: [`Authenticating ${email}`],
        autoEnd: false,
    });

    log.snapshot('before');

    const wrappedSignIn = signIn({ username: email, password });

    cy.wrap(wrappedSignIn, { log: false }).then(() => {
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
                cy.visit('/profile');
                cy.location('pathname').should('equal', '/profile');
            },
        },
    );
});
