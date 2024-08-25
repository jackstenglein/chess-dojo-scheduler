import { tournamentsClock } from './util';

describe('Leaderboard Tab', () => {
    beforeEach(() => {
        // Mock API responses
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=monthly&tournamentType=ARENA&timeControl=blitz&date=2023-09-13T05:00:00.000Z',
            {
                fixture: 'tournaments/leaderboardBlitzArenaMonthly.json',
            },
        );
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=yearly&tournamentType=ARENA&timeControl=rapid&date=2023-09-13T05:00:00.000Z',
            {
                fixture: 'tournaments/leaderboardRapidArenaYearly.json',
            },
        );

        // Log in via API
        cy.loginByCognitoApi(
            'tournaments',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        // Set up clock and visit the tournaments page
        cy.clock(tournamentsClock);
        cy.visit('/tournaments?type=leaderboard');
        cy.tick(1000); // Necessary when using cy.clock
    });

    it('contains search options', () => {
        // Wait for the Leaderboard tab to be visible and click it
        cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

        // Check for the presence of search options
        cy.getBySel('time-control-selector').should('be.visible');
        cy.getBySel('tournament-type-selector').should('be.visible');
        cy.contains('September 2023').should('be.visible');
        cy.contains('Monthly').should('be.visible');
        cy.contains('Yearly').should('be.visible');
    });

    it('contains correct columns', () => {
        // Wait for the Leaderboard tab to be visible and click it
        cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

        // Define the expected column headers
        const columns = ['Rank', 'Username', 'Rating', 'Score'];

        // Check that the correct columns are displayed in the leaderboard
        cy.getBySel('leaderboard')
            .find('.MuiDataGrid-columnHeader')
            .should('have.length', columns.length);

        cy.getBySel('leaderboard').containsAll(columns);
    });

    // it('displays correct data', () => {
    //     // Wait for the Leaderboard tab to be visible and click it
    //     cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

    //     cy.getBySel('leaderboard').contains('No Rows');
       
    // });
});


