import { cancelPreflight, deleteCurrentGame, gameUrlRegex } from './helpers';

describe('Import Games Page - Position', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games/import');
    });

    it('submits with default FEN', () => {
        cy.getBySel('import-starting-position').click();

        cy.location('pathname').should('match', gameUrlRegex);
        cancelPreflight();

        deleteCurrentGame();
    });

    it('shows unlisted icon', () => {
        cy.getBySel('import-starting-position').click();

        cy.location('pathname').should('match', gameUrlRegex);
        cancelPreflight();

        cy.getBySel('unlisted-icon').click();
        cy.getBySel('underboard-tab-settings').should('be.visible');
    });
});
