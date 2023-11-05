describe('Scoreboard Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'scoreboard',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/scoreboard');
    });

    it('redirects to cohort-specific scoreboard', () => {
        cy.location('pathname').should('match', /^\/scoreboard\/\d+-\d+$/);
    });

    it('has selector to change views', () => {
        cy.getBySel('scoreboard-view-selector').click();
        cy.contains('User Search').click();

        cy.location('pathname').should('equal', '/scoreboard/search');
    });

    it('contains tables for current members and graduates', () => {
        cy.getBySel('current-members-scoreboard');
        cy.getBySel('graduates-scoreboard');
    });

    it('contains links to profile', () => {
        cy.contains('Test Account').should(
            'have.attr',
            'href',
            '/profile/398ee7df-13a1-4fbf-bae3-e156f252512d'
        );
    });

    it('hides free-tier users', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/scoreboard');

        cy.getBySel('upsell-alert')
            .contains('View Prices')
            .should('have.attr', 'href', 'https://www.chessdojo.club/plans-pricing');
        cy.getBySel('current-members-scoreboard').contains('No rows');
    });

    it('contains column groups', () => {
        cy.viewport(15000, 660);

        const columnGroups = [
            'User Info',
            'Ratings',
            'Training Plan',
            'Time Spent',
            'Games + Analysis',
            'Tactics',
            'Middlegames + Strategy',
            'Endgame',
            'Opening',
        ];

        cy.getBySel('current-members-scoreboard')
            .find('.MuiDataGrid-columnHeader--filledGroup')
            .should('have.length', columnGroups.length);

        columnGroups.forEach((group) =>
            cy.getBySel('current-members-scoreboard').contains(group)
        );
    });

    it('contains default columns', () => {
        cy.viewport(15000, 660);

        const defaultColumns = [
            'Name',
            'Graduated',
            'Rating System',
            'Start Rating',
            'Current Rating',
            'Normalized FIDE Rating',
            'Dojo Score',
            'Percent Complete',
            'Cohort Tasks',
            'Last 7 Days',
            'Last 30 Days',
            'Last 90 Days',
            'Last 365 Days',
            'Non-Dojo',
        ];

        defaultColumns.forEach((col) =>
            cy.getBySel('current-members-scoreboard').contains(col)
        );
    });
});
