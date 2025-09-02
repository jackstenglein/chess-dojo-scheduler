import { Event, dateMapper } from '../../util';

const ALL_EVENTS_COUNT = 22;

describe('Calendar Tab', () => {
    beforeEach(() => {
        cy.fixture('tournaments/liga/events.json').then(({ events }: { events: Event[] }) => {
            for (const event of events) {
                const startDate = event.startTime.slice(0, 10);
                const endDate = event.endTime.slice(0, 10);

                event.startTime = event.startTime.replace(startDate, dateMapper[startDate]);
                event.endTime = event.endTime.replace(endDate, dateMapper[endDate]);
            }

            cy.interceptApi('GET', '/calendar', { events });
        });

        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.visit('/tournaments/liga?type=calendar');
        // Fixes flakiness where the browser's timezone doesn't match the test
        // user's saved timezone and the first render selects the wrong day.
        cy.contains('UTC+0').should('exist');
        cy.contains('Today').click();
    });

    it('has tab selector', () => {
        cy.getBySel('tournaments-tab-list').contains('Leaderboard').click();

        cy.location().should((loc) => {
            expect(loc.pathname).to.eq('/tournaments/liga');
            expect(loc.search).to.eq('?type=leaderboard');
        });
    });

    it('has correct filters', () => {
        cy.getBySel('calendar-filters').contains('Timezone');
        cy.getBySel('calendar-filters').getBySel('timezone-selector');

        cy.getBySel('calendar-filters').contains('Types');
        cy.getBySel('calendar-filters').contains('Time Controls');
        cy.getBySel('calendar-filters').contains('Starting Position');
    });

    it('displays correct events for type filters', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('tournament-types').click();
        cy.get('.MuiPopover-root').contains('Arena').click();
        cy.get('.rs__event__item').should('have.length', 8);

        cy.get('.MuiPopover-root').contains('Swiss').click();
        cy.get('.MuiPopover-root').contains('Arena').click();
        cy.get('.rs__event__item').should('have.length', 14);
    });

    it('displays correct events for time control filters', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('time-controls').click();
        cy.get('.MuiPopover-root').contains('Blitz').click();
        cy.get('.rs__event__item').should('have.length', 13);

        cy.get('.MuiPopover-root').contains('Blitz').click();
        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.rs__event__item').should('have.length', 4);

        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 5);

        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.rs__event__item').should('have.length', 9);
    });

    it('displays correct events for starting position filters', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('starting-position').click();
        cy.get('.MuiPopover-root').contains('Custom').click();
        cy.get('.rs__event__item').should('have.length', 1);

        cy.get('.MuiPopover-root').contains('Standard').click();
        cy.get('.MuiPopover-root').contains('Custom').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT - 1);
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
        cy.get('.rs__event__item')
            .contains('Endgame Sparring - Pos 9 Arena')
            .click({ force: true });

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

        cy.get('.MuiPopover-root').contains('Position');
        cy.get('.MuiPopover-root').find('cg-board');
    });

    it('allows switching between month, week and day views', () => {
        cy.get('[data-testid="rs-wrapper"]').contains('Month').click();
        cy.get('.rs__header').should('have.length', 7);

        cy.get('[data-testid="rs-wrapper"]').contains('Week').click();
        cy.get('.rs__header').should('have.length', 31);
        cy.get('.rs__cell').should('have.length', 25 * 8);

        cy.get('[data-testid="rs-wrapper"]').contains('Day').click();
        cy.get('.rs__cell').should('have.length', 25 * 2);
    });
});
