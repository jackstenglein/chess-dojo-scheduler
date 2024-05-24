import { tournamentsClock } from '../tournaments/util';

describe('Calendar Page', () => {
    beforeEach(() => {
        cy.interceptApi('GET', '/event', { fixture: 'calendar/events.json' });
        cy.loginByCognitoApi(
            'calendar',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.clock(tournamentsClock);

        cy.visit('/calendar');
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
            .contains('View Prices')
            .should('have.attr', 'href', '/prices');

        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('upsell-dialog')
            .contains('View Prices')
            .should('have.attr', 'href', '/prices');
    });

    it('displays correct events for tournament filters', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('dojoliga-tournaments').click();
        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 12);

        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 3);
    });

    it('displays correct events for dojo events filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('my-dojo-calendar').click();
        cy.get('.MuiPopover-root').contains('Availabilities').click();
        cy.get('.MuiPopover-root').contains('Meetings').click();
        cy.get('.MuiPopover-root').contains('Coaching Sessions').click();
        cy.get('.rs__event__item').should('have.length', 25);
    });

    it('displays correct events for meeting types filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('calendar-filters').contains('All Types').click();
        cy.get('.MuiPopover-root').contains('All Types').click();
        cy.get('.rs__event__item').should('have.length', 24);

        cy.get('.MuiPopover-root').contains('Classical Game').click();
        cy.get('.rs__event__item').should('have.length', 26);
    });

    it('displays correct events for cohort filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('calendar-filters').contains('All Cohorts').click();
        cy.get('.MuiPopover-root').contains('All Cohorts').click();
        cy.get('.rs__event__item').should('have.length', 24);

        cy.get('.MuiPopover-root').contains('1500-1600').click();
        cy.get('.rs__event__item').should('have.length', 26);
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
        cy.contains('9/13/2023');

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
