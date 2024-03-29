import { tournamentsClock } from '../tournaments/util';

describe('Event Editor', () => {
    beforeEach(() => {
        cy.interceptApi('GET', '/event', { fixture: 'calendar/events.json' });
        cy.loginByCognitoApi(
            'calendar',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.clock(tournamentsClock);

        cy.visit('/calendar');
        cy.getBySel('calendar-filters').contains('Dojo Events').click();
    });

    it('shows and hides event editor', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-editor');
        cy.getBySel('cancel-button').click();
        cy.getBySel('event-editor').should('not.exist');
    });

    it('contains correct content', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-editor-title').contains('Edit Event');
        cy.getBySel('event-editor-date').contains('Sunday, Sep 10');

        cy.getBySel('event-editor').contains('Times');
        cy.getBySel('event-editor').contains(
            'Availabilities must be at least one hour long'
        );
        cy.getBySel('event-editor').find('#start-time');
        cy.getBySel('event-editor').find('#end-time');

        cy.getBySel('event-editor').contains('Location (Optional)');
        cy.getBySel('event-editor').contains(
            'Add a Zoom link, specify a Discord classroom, etc.'
        );
        cy.getBySel('location-textfield');

        cy.getBySel('event-editor').contains('Description (Optional)');
        cy.getBySel('event-editor').contains(
            'Add a sparring position or any other notes for your opponent.'
        );
        cy.getBySel('description-textfield');

        cy.getBySel('availability-types-section').contains('Availability Types');
        cy.getBySel('availability-types-section').contains(
            'Choose the meeting types you are available for.'
        );
        [
            'All Types',
            'Classical Game',
            'Opening Sparring',
            'Middlegame Sparring',
            'Endgame Sparring',
            'Rook Endgame Progression',
            'Analyze Classic Game',
            'Analyze Own Game',
            'Book Study',
        ].forEach((t) => cy.getBySel('availability-types-section').contains(t));

        cy.getBySel('event-editor').contains('Max Participants');
        cy.getBySel('event-editor').contains(
            'The number of people that can book your availability (not including yourself).'
        );
        cy.getBySel('participants-textfield');

        cy.getBySel('event-editor').contains('Cohorts');
        cy.getBySel('event-editor').contains(
            'Choose the cohorts that can book your availability.'
        );
    });

    it('selects default cohorts on open', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('cohort-checkbox-1400-1500').find('input').should('be.checked');
        cy.getBySel('cohort-checkbox-1500-1600').find('input').should('be.checked');
        cy.getBySel('cohort-checkbox-1600-1700').find('input').should('be.checked');
    });

    it('requires at least one type to save', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('save-button').click();

        cy.getBySel('event-editor').contains('At least one type is required');
    });

    it('requires at least one cohort to save', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('availability-types-section').contains('All Types').click();
        cy.getBySel('cohort-checkbox-1400-1500').click();
        cy.getBySel('cohort-checkbox-1500-1600').click();
        cy.getBySel('cohort-checkbox-1600-1700').click();
        cy.getBySel('save-button').click();

        cy.getBySel('event-editor').contains('At least one cohort is required');
    });

    it('creates and deletes availability', () => {
        cy.clock().invoke('restore');
        cy.visit('/calendar');

        cy.get('.rs__today_cell').not('.rs__header').first().click();
        cy.getBySel('availability-types-section').contains('All Types').click();
        cy.getBySel('save-button').click();
        cy.get('.rs__today_cell')
            .not('.rs__header')
            .first()
            .contains('Available - Group')
            .click();

        cy.getBySel('availability-viewer').contains('Number of Participants');
        cy.getBySel('availability-viewer').contains('0 / 100');
        cy.getBySel('availability-viewer').contains('Available Types');
        cy.getBySel('availability-viewer').contains('Cohorts');
        cy.getBySel('book-button').should('not.exist');

        cy.get('[data-testid="DeleteRoundedIcon"]').click();
        cy.contains('DELETE').click();

        cy.contains('Availability deleted');
    });
});
