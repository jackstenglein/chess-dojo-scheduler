describe('Books Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/material/books');
    });

    it('should have correct sections', () => {
        cy.contains('Main Recommendations');
        cy.contains('Tactics');
        cy.contains('Endgames');
    });

    it('should have cohort selector', () => {
        cy.getBySel('cohort-selector').should('be.visible');
    });
});
