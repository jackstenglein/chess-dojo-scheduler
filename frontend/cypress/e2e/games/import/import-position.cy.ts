describe('Import Games Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
        // TODO click
    });

    it.skip('submits with default FEN', () => {});
    it.skip('submits with custom FEN', () => {});
    it.skip('requires supported FEN', () => {});
    it.skip('requires a FEN', () => {});
});
