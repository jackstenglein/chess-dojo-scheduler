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

import 'cypress-real-events';
import './commands';

// By importing this here, our custom commands defined in commands.ts
// are available to it
import './auth-provider-commands/cognito';
