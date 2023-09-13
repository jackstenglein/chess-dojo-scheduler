describe('Statistics Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'scoreboard',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/scoreboard/stats');
    });

    it('has selector to change views', () => {
        cy.getBySel('scoreboard-view-selector').click();
        cy.contains('User Search').click();

        cy.location('pathname').should('equal', '/scoreboard/search');
    });

    it('has correct graphs', () => {
        const titles = [
            'Total Rating Change',
            'Average Rating Change',
            'Total Time Spent',
            'Average Time Spent',
            'Average Rating Change Per Hour',
            'Number of Graduations',
            'Average Time to Graduate',
            'Total Dojo Score',
            'Average Dojo Score',
            'Participants',
            'Rating Systems',
        ];

        cy.getBySel('chart-title').should('have.length', titles.length);
        titles.forEach((title) => cy.contains(title));
    });
});
