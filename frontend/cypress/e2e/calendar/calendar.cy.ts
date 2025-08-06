import { dateMapper, Event } from '../util';

const ALL_EVENTS_COUNT = 26;

describe('Calendar Page', () => {
    beforeEach(() => {
        cy.fixture('calendar/events.json').then(({ events }: { events: Event[] }) => {
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

        cy.visit('/calendar');
        // Fixes flakiness where the browser's timezone doesn't match the test
        // user's saved timezone and the first render selects the wrong day.
        cy.contains('UTC+0').should('exist');
        cy.contains('Today').click();
    });

    it('has correct filters', () => {
        cy.getBySel('calendar-filters').contains('Timezone');
        cy.getBySel('calendar-filters').getBySel('timezone-selector');

        cy.getBySel('calendar-filters').contains('My Dojo Calendar');
        cy.getBySel('calendar-filters').contains('DojoLiga Tournaments');
        cy.getBySel('calendar-filters').contains('Bookable Meetings');
        cy.getBySel('calendar-filters').contains('Cohorts');
    });

    it('prevents free users from adding events', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/calendar');

        cy.getBySel('upsell-alert')
            .contains('View Options')
            .should('have.attr', 'href', '/prices?redirect=/calendar');

        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('upsell-dialog')
            .contains('View Options')
            .should('have.attr', 'href', '/prices?redirect=/calendar');
    });

    it('displays correct events for tournament filters', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('dojoliga-tournaments').click();
        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 12);

        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 3);
    });

    it('displays correct events for dojo events filter', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('my-dojo-calendar').click();
        cy.get('.MuiPopover-root').contains('Availabilities').click();
        cy.get('.MuiPopover-root').contains('Meetings').click();
        cy.get('.MuiPopover-root').contains('Coaching Sessions').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT - 1);
    });

    it('displays correct events for meeting types filter', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('calendar-filters').contains('All Types').click();
        cy.get('.MuiPopover-root').contains('All Types').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT - 2);

        cy.get('.MuiPopover-root').contains('Classical Game').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);
    });

    it('displays correct events for cohort filter', () => {
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);

        cy.getBySel('calendar-filters').contains('All Cohorts').click();
        cy.get('.MuiPopover-root').contains('All Cohorts').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT - 2);

        cy.get('.MuiPopover-root').contains('1500-1600').click();
        cy.get('.rs__event__item').should('have.length', ALL_EVENTS_COUNT);
    });

    it('displays correct content for availability', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });

        cy.getBySel('availability-viewer').contains('Owner');
        cy.getBySel('availability-viewer')
            .contains('Ricardo Alves (1500-1600)')
            .should('have.attr', 'href', '/profile/c6f63283-044e-49db-b1ba-5b23556a0349');
        cy.getBySel('graduation-icon');

        cy.getBySel('availability-viewer').contains('Available Types');
        cy.getBySel('availability-viewer').contains('Classical Game');

        cy.getBySel('availability-viewer').contains('Description');
        cy.getBySel('availability-viewer').contains('Classical Game + Postmortem');

        cy.getBySel('availability-viewer').contains('Cohorts');
        cy.getBySel('availability-viewer').contains('1400-1500, 1500-1600, 1600-1700');

        cy.getBySel('book-button').contains('Book');
    });

    it('shows availability booker', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });
        cy.getBySel('book-button').click();

        cy.contains('Book Meeting');
        cy.getBySel('cancel-button');
        cy.getBySel('book-button');

        cy.contains('Available Start Times');

        cy.contains('Owner');
        cy.contains('Ricardo Alves (1500-1600)').should(
            'have.attr',
            'href',
            '/profile/c6f63283-044e-49db-b1ba-5b23556a0349',
        );
        cy.getBySel('graduation-icon');

        cy.contains('Location');
        cy.contains('Discord');

        cy.contains('Meeting Type');
        cy.contains('Classical Game');
        cy.getBySel('meeting-type-radio');

        cy.contains('Start Time');
        cy.contains('Must be between');
    });

    it('cancels availability booker', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });
        cy.getBySel('book-button').click();

        cy.getBySel('cancel-button').click();
        cy.getBySel('availability-booker').should('not.exist');
    });
});
