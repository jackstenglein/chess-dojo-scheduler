describe('Import Games Page - Position', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games/import');
    });

    it('submits with default FEN', () => {
        cy.getBySel('import-starting-position').click();

        cy.location('pathname').should('equal', '/games/analysis');
    });
});
