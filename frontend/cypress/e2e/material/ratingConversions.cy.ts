describe('Rating Conversions Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/material?view=ratings');
    });

    it('should have correct content', () => {
        [
            'FIDE (Dojo Cohort)',
            'Chess.com Rapid',
            'Lichess Classical',
            'USCF',
            'ECF',
            'CFC',
            'DWZ',
        ].forEach((item) => cy.contains(item));

        cy.get('tr').should('have.length', Cypress.env('numCohorts') + 1);
    });
});
