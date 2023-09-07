/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
        /**
         * Gets an element based on its data-cy attribute.
         * @param dataCyAttribute The value of the data-cy attribute to get.
         * @param args Optional args to pass to cy.get()
         */
        getBySel(dataCyAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;

        /**
         * Logs into AWS Cognito via the Amplify Auth API, bypassing the login screen.
         * @param sessionId Session ID to restore login status.
         * @param email The email to use when logging in.
         * @param password The password to use when logging in.
         */
        loginByCognitoApi(
            sessionId: string,
            email: string,
            password: string
        ): Chainable<any>;
    }
}
