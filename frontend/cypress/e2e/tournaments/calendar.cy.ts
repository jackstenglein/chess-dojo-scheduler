import { tournamentsClock } from './util';

describe('Calendar Tab', () => {
    beforeEach(() => {
        cy.interceptApi('GET', '/event', { fixture: 'tournaments/events.json' });
        cy.loginByCognitoApi(
            'tournaments',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.clock(tournamentsClock);

        cy.visit('/tournaments?type=calendar');
    });

    it('has tab selector', () => {
        cy.getBySel('tournaments-tab-list').contains('Leaderboard').click();

        cy.location().should((loc) => {
            expect(loc.pathname).to.eq('/tournaments');
            expect(loc.search).to.eq('?type=leaderboard');
        });
    });

    it('has correct filters', () => {
        cy.getBySel('calendar-filters').contains('Timezone');
        cy.getBySel('calendar-filters').getBySel('timezone-selector');

        cy.getBySel('calendar-filters').contains('Types');
        cy.getBySel('calendar-filters').contains('Swiss');
        cy.getBySel('calendar-filters').contains('Arena');

        cy.getBySel('calendar-filters').contains('Time Controls');
        cy.getBySel('calendar-filters').contains('Blitz');
        cy.getBySel('calendar-filters').contains('Rapid');
        cy.getBySel('calendar-filters').contains('Classical');

        cy.getBySel('calendar-filters').contains('Starting Position');
        cy.getBySel('calendar-filters').contains('Standard');
        cy.getBySel('calendar-filters').contains('Custom');
    });

    it('displays correct events for type filters', () => {
        cy.get('.rs__event__item').should('have.length', 22);

        cy.getBySel('calendar-filters').contains('Swiss').click();
        cy.get('.rs__event__item').should('have.length', 8);

        cy.getBySel('calendar-filters').contains('Swiss').click();
        cy.getBySel('calendar-filters').contains('Arena').click();
        cy.get('.rs__event__item').should('have.length', 14);
    });

    it('displays correct events for time control filters', () => {
        cy.get('.rs__event__item').should('have.length', 22);

        cy.getBySel('calendar-filters').contains('Rapid').click();
        cy.getBySel('calendar-filters').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 13);

        cy.getBySel('calendar-filters').contains('Blitz').click();
        cy.getBySel('calendar-filters').contains('Rapid').click();
        cy.get('.rs__event__item').should('have.length', 4);

        cy.getBySel('calendar-filters').contains('Rapid').click();
        cy.getBySel('calendar-filters').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 5);

        cy.getBySel('calendar-filters').contains('Rapid').click();
        cy.get('.rs__event__item').should('have.length', 9);
    });

    it('displays correct events for starting position filters', () => {
        cy.get('.rs__event__item').should('have.length', 22);

        cy.getBySel('calendar-filters').contains('Standard').click();
        cy.get('.rs__event__item').should('have.length', 1);

        cy.getBySel('calendar-filters').contains('Standard').click();
        cy.getBySel('calendar-filters').contains('Custom').click();
        cy.get('.rs__event__item').should('have.length', 21);
    });

    it('displays correct popup for events', () => {
        cy.get('.rs__event__item').contains('Monday Weekly Rapid No. 2').first().click();

        cy.get('.MuiPopover-root').contains('Monday Weekly Rapid No. 2');
        cy.get('.MuiPopover-root').contains('Rated Swiss');
        cy.get('.MuiPopover-root').contains('Location');
        cy.get('.MuiPopover-root')
            .contains('https://lichess.org')
            .should('have.attr', 'href', 'https://lichess.org/swiss/emvDaOFv');

        cy.get('.MuiPopover-root').contains('Time Control');
        cy.get('.MuiPopover-root').contains('15+5');

        cy.get('.MuiPopover-root').contains('Rounds');
        cy.get('.MuiPopover-root').contains('3');
    });

    it('displays board in custom position event popups', () => {
        cy.getBySel('calendar-filters').contains('Standard').click();
        cy.get('.rs__event__item').first().click();

        cy.get('.MuiPopover-root').contains('Endgame Sparring - Pos 9 Arena');
        cy.get('.MuiPopover-root').contains('Unrated Arena');
        cy.get('.MuiPopover-root').contains('Location');
        cy.get('.MuiPopover-root')
            .contains('https://lichess.org')
            .should('have.attr', 'href', 'https://lichess.org/tournament/a2Sn1hKA');

        cy.get('.MuiPopover-root').contains('Description');
        cy.get('.MuiPopover-root').contains(
            'DojoLiga Endgame Series Pos. 9 from Petrosian-Ivkov 1982',
        );

        cy.get('.MuiPopover-root').contains('Time Control');
        cy.get('.MuiPopover-root').contains('15+5');

        cy.tick(250);
        cy.get('.MuiPopover-root').contains('Position');
        cy.get('.MuiPopover-root').find('cg-board');
    });

    it('allows switching between month, week and day views', () => {
        cy.get('[data-testid="rs-wrapper"]').contains('Month').click();
        cy.get('.rs__cell').should('have.length', 6 * 7);

        cy.get('[data-testid="rs-wrapper"]').contains('Week').click();
        cy.get('.rs__cell').should('have.length', 25 * 8);

        cy.get('[data-testid="rs-wrapper"]').contains('Day').click();
        cy.get('.rs__cell').should('have.length', 25 * 2);
    });
});
