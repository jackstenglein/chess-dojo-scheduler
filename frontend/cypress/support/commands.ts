/// <reference types="cypress" />
// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import { fromZodError } from 'zod-validation-error';

import { EnvSchema, EnvVarName } from '../env';

Cypress.Commands.add('getBySel', (selector, options) => {
    return cy.get(`[data-cy="${selector}"]`, options);
});

Cypress.Commands.add('findBySel', (selector, options) => {
    return cy.find(`[data-cy="${selector}"]`, options);
});

Cypress.Commands.add('interceptApi', (method, url, response) => {
    return cy.intercept(method, `${cy.dojo.env('apiBaseUrl')}${url}`, response);
});

Cypress.Commands.add('containsAll', (texts) => {
    texts.forEach((title) => {
        cy.contains(title);
    });
});

cy.dojo = {
    env<K extends EnvVarName>(name: K) {
        // Validation has relatively negligible performance impact here
        const { success, error, data } = EnvSchema.safeParse(Cypress.env());
        if (!success) {
            throw fromZodError(error);
        }

        return data[name];
    },
};
