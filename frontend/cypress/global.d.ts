/// <reference types="cypress" />

import type { Method, RouteHandler } from 'cypress/types/net-stubbing';

type CyGetOptions = Parameters<Cypress.Chainable['get']>[1];
type CyFindOptions = Parameters<Cypress.Chainable['find']>[1];

import type { Env, EnvVarName } from './env';

declare global {
    namespace Cypress {
        interface cy {
            dojo: {
                /**
                 * Retrieve a variable via Cypress.env, but ensure type safety.
                 * @param varName The name of the variable to retrieve.
                 */
                env<K extends EnvVarName>(name: K): Env[K];
            };
        }
        interface Chainable {
            /**
             * Gets an element based on its data-cy attribute.
             * @param dataCyAttribute The value of the data-cy attribute to get.
             * @param options reflects options parameter to cy.get()
             */
            getBySel(dataCyAttribute: string, options?: CyGetOptions): Chainable<JQuery>;

            /**
             * Finds an element based on its data-cy attribute.
             * @param dataCyAttribute The value of the data-cy attribute to find.
             * @param options reflects options parameter to cy.find()
             */
            findBySel(dataCyAttribute: string, options?: CyFindOptions): Chainable<JQuery>;

            /**
             * Logs into AWS Cognito via the Amplify Auth API, bypassing the login screen.
             * @param sessionId Session ID to restore login status.
             * @param email The email to use when logging in.
             * @param password The password to use when logging in.
             */
            loginByCognitoApi(sessionId: string, email: string, password: string): Chainable<null>;

            /**
             * Checks to ensure all strings are contained
             *
             * @param texts Strings to check
             */
            containsAll(texts: string[]): Chainable<void>;

            /**
             * Intercepts a request to the site's API.
             * @param method The request method.
             * @param url The URL of the request, omitting the host.
             * @param response The response to return.
             */
            interceptApi(method: Method, url: string, response?: RouteHandler): Chainable<null>;
        }
    }
}
