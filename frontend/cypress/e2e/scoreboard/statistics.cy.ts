describe('Statistics Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/scoreboard/stats');
    });

    it('has selector to change views', () => {
        cy.getBySel('scoreboard-view-selector').click();
        cy.contains('Search Users').click();

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
            'Average Rating Change Per Dojo Point',
            'Participants',
            'Rating Systems',
        ];

        cy.getBySel('chart-title').should('have.length', titles.length);
        cy.containsAll(titles);
    });
});
