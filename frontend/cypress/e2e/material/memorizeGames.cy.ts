describe('Memorize Games Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/material/memorizegames');
    });

    it('should have a game per cohort', () => {
        cy.getBySel('pgn-selector-item').should('have.length', cy.dojo.env('numCohorts'));
    });

    it('should switch between study/test mode', () => {
        cy.contains('Show Answer').should('not.exist');

        cy.contains('Test').click();

        cy.contains('Show Answer').should('be.visible');
    });

    it('should switch between games', () => {
        cy.contains('The Fastest Mate').click();
        cy.getBySel('pgn-text-move-button').first().should('have.text', 'f4');

        cy.contains("Scholar's Mate").click();
        cy.getBySel('pgn-text-move-button').first().should('have.text', 'e4');
    });

    it('should restrict free tier users', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/material/memorizegames');

        cy.getBySel('pgn-selector-item').should('have.length', 3);
        cy.getBySel('upsell-message').should('be.visible');
    });
});
