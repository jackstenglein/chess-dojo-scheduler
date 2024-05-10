function deleteCurrentGame() {
    cy.getBySel('settings').click();
    cy.getBySel('delete-game-button').click();
    cy.getBySel('delete-game-confirm-button').click();
    cy.location('pathname').should('equal', '/profile');
}

describe('Import Games Page - PGN Text', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/submit');
    });

    it('requires PGN to submit manual entry', () => {
        cy.contains('Paste PGN').click();
        cy.getBySel('submit').click();

        cy.contains('This field is required');
    });

    it('submits from manual entry', () => {
        cy.contains('Paste PGN').click();
        cy.getBySel('pgn-text').type(PGN);
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', /^\/games\/\d{4}-\d{4}\/.+$/);
        cy.getBySel('player-header-header').contains('Test2');
        cy.getBySel('player-header-footer').contains('Test1');
        cy.contains('e4');

        deleteCurrentGame();
    });

    it('displays error snackbar on invalid PGN', () => {
        cy.contains('Paste PGN').click();
        cy.getBySel('pgn-text').type(INVALID_PGN);
        cy.getBySel('submit').click();

        cy.location('pathname').should('equal', '/games/submit');
        cy.getBySel('error-snackbar').contains('Invalid PGN');
    });
});
