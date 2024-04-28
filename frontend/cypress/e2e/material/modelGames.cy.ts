describe('Model Games Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/material/modelgames');
    });

    it('should display correct contents', () => {
        cy.getBySel('cohort-select');
        cy.getBySel('pgn-selector-item');
        cy.get('cg-board');
        cy.getBySel('pgn-text');
        cy.getBySel('player-header-header');
        cy.getBySel('player-header-footer');
    });

    it('allows switching cohorts', () => {
        cy.getBySel('cohort-select').click();
        cy.contains('1400-1500').click();
        cy.getBySel('pgn-selector').contains('Ben Wicks - Emma Williams');

        cy.getBySel('cohort-select').click();
        cy.contains('1500-1600').click();
        cy.getBySel('pgn-selector').contains('Clarke VandenHoven - Adithya Chitta');
    });
});
