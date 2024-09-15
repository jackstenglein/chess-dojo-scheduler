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
            'Dojo Cohort',
            'Chess.com Rapid',
            'Lichess Classical',
            'FIDE',
            'USCF',
            'ECF',
            'CFC',
            'DWZ',
            'ACF',
            'KNSB',
        ].forEach((item) => {
            cy.contains(item);
        });

        cy.get('tr').should('have.length', cy.dojo.env('numCohorts') + 1);
    });
});
