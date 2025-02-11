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

    it('prevents navigating away from unsaved analysis', () => {
        cy.getBySel('import-starting-position').click();
        cy.location('pathname').should('equal', '/games/analysis');

        cy.contains('Training Plan').click();

        cy.getBySel('unsaved-analysis-nav-guard').should('be.visible');
    });
});
