// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/code-coverage/support';
import 'cypress-real-events';

// Import commands.ts first so the commands defined in it are
// available to the top level of subsequently imported files.
import './commands';

// Define all other custom commands below. This comment is to prevent
// autosorting of ./comments which will break top level usage of
// cy.dojo.env at minimum
import './auth-provider-commands/cognito';
