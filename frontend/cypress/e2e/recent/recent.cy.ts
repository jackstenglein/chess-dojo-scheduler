const now = new Date(2023, 8, 6); // month is 0-indexed

describe('Graduations', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.clock(now);
    });

    it('displays correct message when no graduations', () => {
        cy.interceptApi('GET', '/public/graduations', {
            fixture: 'recent/noGraduations.json',
        });
        cy.visit('/recent');
        cy.tick(1000); // Necessary when using cy.clock: https://stackoverflow.com/a/71974637
        cy.contains('No graduations in the selected timeframe');
    });

    it('displays correct columns for graduations', () => {
        cy.interceptApi('GET', '/public/graduations', {
            fixture: 'recent/graduations.json',
        });
        cy.visit('/recent');
        cy.tick(1000); // Necessary when using cy.clock: https://stackoverflow.com/a/71974637

        const columns = [
            'Name',
            'Graduated',
            'Old Cohort',
            'New Cohort',
            'Dojo Score',
            'Date',
            'Comments',
        ];

        cy.getBySel('recent-graduates-table')
            .get('.MuiDataGrid-columnHeaders')
            .containsAll(columns);
    });

    it('displays correct graduations from past week', () => {
        cy.interceptApi('GET', '/public/graduations', {
            fixture: 'recent/graduations.json',
        });
        cy.visit('/recent');
        cy.tick(1000); // Necessary when using cy.clock: https://stackoverflow.com/a/71974637

        cy.getBySel('recent-graduates-table').contains('1–11 of 11');
        cy.getBySel('recent-graduates-table')
            .contains('QuiteKnight')
            .should('have.attr', 'href', '/profile/f3ed6d22-4b50-4049-b65f-ff2b1131ba4a');
    });

    it('displays correct graduations for other timeframes', () => {
        cy.interceptApi('GET', '/public/graduations', {
            fixture: 'recent/graduations.json',
        });
        cy.visit('/recent');
        cy.tick(1000); // Necessary when using cy.clock: https://stackoverflow.com/a/71974637

        cy.getBySel('graduates-timeframe-select').click();
        cy.getBySel('Graduation of 8/30/2023').click();
        cy.getBySel('recent-graduates-table').contains('1–9 of 9');
        cy.getBySel('recent-graduates-table')
            .contains('Bodheen')
            .should('have.attr', 'href', '/profile/372ae346-b786-4000-9fc8-36005eb29415');
    });
});
