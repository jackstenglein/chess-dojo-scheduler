import { tournamentsClock } from '../../util';

describe('Leaderboard Tab', () => {
    beforeEach(() => {
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=monthly&tournamentType=ARENA&timeControl=blitz&date=2023-09-13T05:00:00.000Z',
            {
                fixture: 'tournaments/liga/leaderboardBlitzArenaMonthly.json',
            },
        );
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=yearly&tournamentType=ARENA&timeControl=rapid&date=2023-09-13T05:00:00.000Z',
            {
                fixture: 'tournaments/liga/leaderboardRapidArenaYearly.json',
            },
        );

        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.clock(tournamentsClock);
        cy.visit('/tournaments/liga?type=leaderboard');
        cy.tick(1000); // Necessary when using cy.clock: https://stackoverflow.com/a/71974637
    });

    it('contains search options', () => {
        cy.getBySel('time-control-selector').should('be.visible');
        cy.getBySel('tournament-type-selector').should('be.visible');
        cy.contains('September 2023').should('be.visible');
        cy.contains('Monthly').should('be.visible');
        cy.contains('Yearly').should('be.visible');
    });

    it('contains correct columns', () => {
        const columns = ['Rank', 'Username', 'Rating', 'Score'];

        cy.getBySel('leaderboard')
            .find('.MuiDataGrid-columnHeader')
            .should('have.length', columns.length);

        cy.getBySel('leaderboard').containsAll(columns);
    });

    it('displays correct data', () => {
        cy.contains('Yearly').click();
        cy.getBySel('time-control-selector').click();
        cy.get('[data-value="blitz"]').click();
        cy.getBySel('leaderboard').should('be.visible');

        cy.getBySel('leaderboard').contains('newPlayer');
        cy.getBySel('leaderboard').contains('1–10 of 40');
    });
});
