import { tournamentsClock } from './util';

describe('Leaderboard Tab', () => {
    beforeEach(() => {
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=monthly&tournamentType=ARENA&timeControl=blitz&date=2023-09-13T05:00:00.000Z',
            (req) => {
                req.reply((res) => {
                    console.log(res.body);
                    res.send({
                        fixture: 'tournaments/leaderboardBlitzArenaMonthly.json',
                    });
                });
            },
        );
        cy.interceptApi(
            'GET',
            '/public/tournaments/leaderboard?site=lichess.org&timePeriod=yearly&tournamentType=ARENA&timeControl=rapid&date=2023-09-13T05:00:01.000Z',
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
        cy.tick(1000); // Necessary when using cy.clock
    });

    it('contains search options', () => {
        cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

        cy.getBySel('time-control-selector').should('be.visible');
        cy.getBySel('tournament-type-selector').should('be.visible');
        cy.contains('September 2023').should('be.visible');
        cy.contains('Monthly').should('be.visible');
        cy.contains('Yearly').should('be.visible');
    });

    it('contains correct columns', () => {
        cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

        const columns = ['Rank', 'Username', 'Rating', 'Score'];

        cy.getBySel('leaderboard')
            .find('.MuiDataGrid-columnHeader')
            .should('have.length', columns.length);

        cy.getBySel('leaderboard').containsAll(columns);
    });

    it('displays correct data', () => {
        cy.contains('Leaderboard', { timeout: 10000 }).should('be.visible').click();

        cy.contains('Yearly').click();
        cy.getBySel('time-control-selector').click();
        cy.contains('Blitz', { timeout: 10000 }).click();
        cy.getBySel('leaderboard').should('be.visible');

        cy.getBySel('leaderboard').contains('newPlaye');
        cy.getBySel('leaderboard').contains('1–10 of 40');
    });
});
