import { deleteCurrentGame, gameUrlRegex } from './helpers';

describe('Import Games Page - Position', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
    });

    it('submits with default FEN', () => {
        cy.getBySel('import-starting-position').click();

        cy.location('pathname').should('match', gameUrlRegex);
        cy.getBySel('cancel-preflight').click();

        deleteCurrentGame();
    });
});
