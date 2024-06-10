import { tournamentsClock } from './util';

describe('Leaderboard Tab', () => {
    beforeEach(() => {
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
        cy.loginByCognitoApi(
            'tournaments',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.clock(tournamentsClock);

        cy.visit('/tournaments?type=leaderboard');
    });

    it('contains search options', () => {
        cy.getBySel('time-control-selector');
        cy.getBySel('tournament-type-selector');
        cy.contains('September 2023');
        cy.contains('Monthly');
        cy.contains('Yearly');
    });

    it('contains correct columns', () => {
        const columns = ['Rank', 'Lichess Username', 'Lichess Rating', 'Score'];

        cy.getBySel('leaderboard')
            .find('.MuiDataGrid-columnHeader')
            .should('have.length', columns.length);

        cy.getBySel('leaderboard').containsAll(columns);
    });

    it('displays correct data', () => {
        cy.getBySel('leaderboard').contains('agedwhitecheddar');
        cy.getBySel('leaderboard').contains('1–10 of 189');

        cy.contains('Yearly').click();
        cy.getBySel('time-control-selector').click();
        cy.contains('Rapid').click();

        cy.getBySel('leaderboard').contains('sir_ser');
        cy.getBySel('leaderboard').contains('agedwhitecheddar').should('not.exist');
        cy.getBySel('leaderboard').contains('1–10 of 193');
    });
});
