const now = new Date(2023, 8, 6); // month is 0-indexed

describe('Graduations', () => {
    beforeEach(() => {
        cy.clock(now);
        cy.loginByCognitoApi(
            'recent',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/recent');
    });

    it('displays correct message when no graduations', () => {
        cy.interceptApi('GET', '/graduations', {
            fixture: 'recent/noGraduations.json',
        });
        cy.contains('No graduations in the selected timeframe');
    });

    it('displays correct columns for graduations', () => {
        cy.interceptApi('GET', '/graduations', {
            fixture: 'recent/graduations.json',
        });

        [
            'Name',
            'Graduated',
            'Old Cohort',
            'New Cohort',
            'Dojo Score',
            'Date',
            'Comments',
        ].forEach((col) =>
            cy
                .getBySel('recent-graduates-table')
                .get('.MuiDataGrid-columnHeaders')
                .contains(col),
        );
    });

    it('displays correct graduations from past week', () => {
        cy.interceptApi('GET', '/graduations', {
            fixture: 'recent/graduations.json',
        });

        cy.getBySel('recent-graduates-table').contains('1–11 of 11');
        cy.getBySel('recent-graduates-table')
            .contains('QuiteKnight')
            .should('have.attr', 'href', '/profile/f3ed6d22-4b50-4049-b65f-ff2b1131ba4a');
    });

    it('displays correct graduations for other timeframes', () => {
        cy.interceptApi('GET', '/graduations', {
            fixture: 'recent/graduations.json',
        });

        cy.getBySel('graduates-timeframe-select').click();
        cy.getBySel('Graduation of 8/30/2023').click();
        cy.getBySel('recent-graduates-table').contains('1–9 of 9');
        cy.getBySel('recent-graduates-table')
            .contains('Bodheen')
            .should('have.attr', 'href', '/profile/372ae346-b786-4000-9fc8-36005eb29415');
    });
});

describe('Featured Games', () => {
    beforeEach(() => {
        cy.clock(now);
        cy.loginByCognitoApi(
            'recent',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/recent');
    });

    it('displays correct message when no featured games', () => {
        cy.interceptApi('GET', '/game/featured', {
            fixture: 'recent/noGames.json',
        });
        cy.contains('No featured games in the past month');
    });

    it('displays featured games', () => {
        cy.interceptApi('GET', '/game/featured', {
            fixture: 'recent/games.json',
        });

        cy.getBySel('featured-games-table').contains('Beingbadatchess');
    });
});
