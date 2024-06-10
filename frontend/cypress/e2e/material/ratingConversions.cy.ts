describe('Rating Conversions Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/material/ratings');
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
        ].forEach((item) => {
            cy.contains(item);
        });

        cy.get('tr').should('have.length', cy.dojo.env('numCohorts') + 1);
    });
});
