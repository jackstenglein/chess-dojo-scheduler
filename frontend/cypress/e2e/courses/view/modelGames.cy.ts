describe('Model Games Module', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit(
            '/courses/OPENING/b042a392-e285-4466-9bc0-deeecc2ce16c?chapter=0&module=4',
        );
    });

    it('should display PGN selector an board', () => {
        cy.getBySel('pgn-selector').should('be.visible');
        cy.getBySel('chessground-board').should('be.visible');
    });
});
