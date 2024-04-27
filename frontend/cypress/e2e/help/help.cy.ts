describe('Help Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'help',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/help');
    });

    it('renders', () => {
        cy.contains('Help/FAQs');
    });

    it('launches profile tutorial', () => {
        cy.contains('Launch Profile Page Tutorial').click();

        cy.location('pathname').should('equal', '/profile');
        cy.getBySel('tutorial-tooltip').contains('Welcome to the Dojo');
    });

    it('launches scoreboard tutorial', () => {
        cy.contains('Launch Scoreboard Page Tutorial').click();

        cy.location('pathname').should('contain', '/scoreboard');
        cy.getBySel('tutorial-tooltip').contains('Welcome to the Scoreboard');
    });

    it('launches calendar tutorial', () => {
        cy.contains('Launch Calendar Page Tutorial').click();

        cy.location('pathname').should('equal', '/calendar');
        cy.getBySel('tutorial-tooltip').contains('Welcome to the calendar');
    });

    it('launches games tutorial', () => {
        cy.contains('Launch Games Page Tutorial').click();

        cy.location('pathname').should('equal', '/games');
        cy.getBySel('tutorial-tooltip').contains('Welcome to the Dojo Game Database');
    });

    it('requires all fields to submit support ticket', () => {
        cy.getBySel('support-ticket-submit').click();

        cy.getBySel('support-ticket-name').contains('This field is required');
        cy.getBySel('support-ticket-email').contains('This field is required');
        cy.getBySel('support-ticket-subject').contains('This field is required');
        cy.getBySel('support-ticket-message').contains('This field is required');
    });
});
