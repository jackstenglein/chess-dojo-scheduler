/// <reference types="cypress" />
// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import './auth-provider-commands/cognito';

Cypress.Commands.add('getBySel', (selector, ...args) => {
    return cy.get(`[data-cy="${selector}"]`, ...args);
});

Cypress.Commands.add('findBySel', (selector, ...args) => {
    return cy.find(`[data-cy="${selector}"]`, ...args);
});

Cypress.Commands.add('interceptApi', (method, url, response) => {
    return cy.intercept(method, `${Cypress.env('apiBaseUrl')}${url}`, response);
});
