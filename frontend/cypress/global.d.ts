/// <reference types="cypress" />

import { Method, RouteMatcher, RouteHandler } from 'cypress/types/net-stubbing';

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Gets an element based on its data-cy attribute.
             * @param dataCyAttribute The value of the data-cy attribute to get.
             * @param args Optional args to pass to cy.get()
             */
            getBySel(dataCyAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;

            /**
             * Finds an element based on its data-cy attribute.
             * @param dataCyAttribute The value of the data-cy attribute to find.
             * @param args Optional args to pass to cy.find()
             */
            findBySel(
                dataCyAttribute: string,
                args?: any
            ): Chainable<JQuery<HTMLElement>>;

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

            /**
             * Intercepts a request to the site's API.
             * @param method The request method.
             * @param url The URL of the request, omitting the host.
             * @param response The response to return.
             */
            interceptApi(
                method: Method,
                url: RouteMatcher,
                response?: RouteHandler
            ): Chainable<null>;
        }
    }
}
