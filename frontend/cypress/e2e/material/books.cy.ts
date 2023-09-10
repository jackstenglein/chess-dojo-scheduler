describe('Books Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/material?view=books');
    });

    it('should have correct sections', () => {
        cy.contains('Main Recommendations');
        cy.contains('Tactics');
        cy.contains('Endgames');
    });

    it('should have sections collapsed by default', () => {
        cy.contains('Laszlo Polgar').should('not.be.visible');
    });

    it('should allow expanding sections', () => {
        cy.contains('Main Recommendations').click();

        cy.contains('Laszlo Polgar').should('be.visible');
    });
});
