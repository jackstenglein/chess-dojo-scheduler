describe('Memorize Games Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/material?view=memorizeGames');
    });

    it('should have link to Lichess study', () => {
        cy.contains('Lichess study').should(
            'have.attr',
            'href',
            'https://lichess.org/study/u9qJoSlL'
        );
    });

    it('should have a game per cohort', () => {
        cy.getBySel('pgn-selector-item').should('have.length', Cypress.env('numCohorts'));
    });

    it('should switch between study/test mode', () => {
        // start in study mode
        cy.getBySel('player-header-header').should('be.visible');
        cy.getBySel('player-header-footer').should('be.visible');
        cy.getBySel('pgn-text').should('be.visible');

        cy.contains('Test').click();

        cy.getBySel('player-header-header').should('not.exist');
        cy.getBySel('player-header-footer').should('not.exist');
        cy.getBySel('pgn-text').should('not.exist');
        cy.getBySel('coach-image').should('be.visible');
        cy.contains('What did white play in this position?');
    });

    it('should switch between games', () => {
        cy.contains('The Fastest Mate').click();
        cy.getBySel('pgn-text-move-button').first().should('have.text', 'f4');

        cy.contains("Scholar's Mate").click();
        cy.getBySel('pgn-text-move-button').first().should('have.text', 'e4');
    });
});
