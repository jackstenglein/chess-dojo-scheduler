describe('Event Editor', () => {
    beforeEach(() => {
        cy.interceptApi('GET', '/calendar', { fixture: 'calendar/events.json' });
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.visit('/calendar');
    });

    it('shows and hides event editor', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-editor');
        cy.getBySel('cancel-button').click();
        cy.getBySel('event-editor').should('not.exist');
    });

    it('contains correct content', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-title-textfield');

        cy.getBySel('event-editor').find('#start-time');
        cy.getBySel('event-editor').find('#end-time');

        cy.getBySel('event-editor').contains('Add a Zoom link, specify a Discord classroom, etc.');
        cy.getBySel('location-textfield');

        cy.getBySel('description-textfield');

        cy.getBySel('event-editor').contains('Choose the meeting types you are available for.');

        cy.getBySel('event-editor').contains(
            'The number of people that can book your availability (not including yourself).',
        );
        cy.getBySel('participants-textfield');

        cy.getBySel('event-editor').contains('Choose the cohorts that can book your availability.');
    });

    it('selects default cohorts on open', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-editor').contains('1400-1500');
        cy.getBySel('event-editor').contains('1500-1600');
        cy.getBySel('event-editor').contains('1600-1700');
        cy.getBySel('event-editor').contains('1700-1800').should('not.exist');
    });

    it('requires at least one type to save', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('save-button').click();

        cy.getBySel('event-editor').contains('At least one type is required');
    });

    it('requires at least one cohort to save', () => {
        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('event-editor').find(`[data-cy="cohort-selector"]`).click();
        cy.get('.MuiPopover-root').contains('All Cohorts').click();
        cy.get('.MuiPopover-root').contains('All Cohorts').click();
        cy.getBySel('save-button').click({ force: true });

        cy.getBySel('event-editor').contains('At least one cohort is required');
    });

    it('creates and deletes availability', () => {
        cy.clock().invoke('restore');
        cy.visit('/calendar');

        cy.get('.rs__today_cell').not('.rs__header').first().click();
        cy.getBySel('availability-type-selector').click();
        cy.get('.MuiPopover-root').contains('All Types').click();
        cy.getBySel('save-button').click({ force: true });
        cy.get('.rs__today_cell').not('.rs__header').first().contains('Available - Group').click();

        cy.getBySel('availability-viewer').contains('Number of Participants');
        cy.getBySel('availability-viewer').contains('0 / 100');
        cy.getBySel('availability-viewer').contains('Available Types');
        cy.getBySel('availability-viewer').contains('Cohorts');
        cy.getBySel('book-button').should('not.exist');

        cy.get('.rs__popper_actions').get('button').last().click();
        cy.contains('DELETE').click();

        cy.contains('Availability deleted');
    });
});
