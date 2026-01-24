describe('Default Time Control (localStorage)', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        // Clear localStorage before each test (after login so window exists)
        cy.window().then((win) => {
            win.localStorage.removeItem('defaultTimeControl');
        });
    });

    afterEach(() => {
        // Remove beforeunload handler to prevent "Leave page?" dialog from blocking test cleanup
        cy.window().then((win) => {
            win.onbeforeunload = null;
        });
    });

    it('saves time control to localStorage when edited', () => {
        cy.visit('/games/import');
        // Wait for the button to be visible and enabled, then click
        cy.getBySel('import-starting-position')
            .should('be.visible')
            .and('not.be.disabled')
            .click();
        // Wait for navigation with longer timeout and retry if needed
        cy.location('pathname', { timeout: 15000 }).should('equal', '/games/analysis');

        // Open the Tags tab
        cy.getBySel('underboard-button-tags').click();

        // Find and double-click the TimeControl value cell to edit it
        cy.contains('[role="gridcell"]', 'TimeControl')
            .parent()
            .find('[role="gridcell"]')
            .last()
            .dblclick();

        // The TimeControlEditor dialog should open
        cy.contains('Update Time Control').should('be.visible');

        // Set initial time to 1:30:00 (90 minutes = 5400 seconds)
        // MUI TimeField uses sectioned input - click to focus, select all, then type
        cy.contains('Initial Time (hh:mm:ss)')
            .closest('.MuiFormControl-root')
            .find('input')
            .click({ force: true })
            .focused()
            .type('{selectall}01:30:00', { force: true });

        // Set increment to 30 seconds (Bonus Time field)
        cy.contains('Bonus Time (Sec)')
            .closest('.MuiFormControl-root')
            .find('input')
            .clear()
            .type('30');

        // Click Update button
        cy.contains('button', 'Update').click();

        // Verify the value was saved to localStorage
        cy.window().then((win) => {
            const stored = win.localStorage.getItem('defaultTimeControl');
            expect(stored).to.equal('5400+30');
        });
    });

    it('pre-fills time control from localStorage on new game', () => {
        // Navigate to import page first
        cy.visit('/games/import');

        // Set a default time control in localStorage after page loads
        cy.window().then((win) => {
            win.localStorage.setItem('defaultTimeControl', '5400+30');
        });

        // Click to create a new game - the localStorage value should be read
        cy.getBySel('import-starting-position')
            .should('be.visible')
            .and('not.be.disabled')
            .click();
        cy.location('pathname', { timeout: 15000 }).should('equal', '/games/analysis');

        // Open the Tags tab
        cy.getBySel('underboard-button-tags').click();

        // Verify the TimeControl row shows the pre-filled value
        cy.contains('[role="row"]', 'TimeControl').should('contain', '5400+30');
    });

    it('does not override existing time control from imported game', () => {
        cy.visit('/games/import');

        // Set a default in localStorage after page loads
        cy.window().then((win) => {
            win.localStorage.setItem('defaultTimeControl', '5400+30');
        });

        cy.getBySel('import-pgn-text').click();

        // Use a minimal PGN with TimeControl to avoid React re-render issues
        const pgnWithTimeControl = '[TimeControl "3600+0"]\n\n1. e4 *';

        // Type slowly to avoid React's infinite update loop with TextareaAutosize
        cy.get('[data-cy="pgn-text"]')
            .find('textarea')
            .first()
            .click()
            .type(pgnWithTimeControl, { delay: 10 });

        // Use the import button with data-cy
        cy.getBySel('import-button')
            .should('be.visible')
            .and('not.be.disabled')
            .click();

        // Should be on analysis page
        cy.location('pathname', { timeout: 15000 }).should('equal', '/games/analysis');

        // Open the Tags tab
        cy.getBySel('underboard-button-tags').click();

        // Verify the original TimeControl is preserved (3600+0), not the localStorage default (5400+30)
        cy.contains('[role="row"]', 'TimeControl').should('contain', '3600+0');
        cy.contains('[role="row"]', 'TimeControl').should('not.contain', '5400+30');
    });
});
