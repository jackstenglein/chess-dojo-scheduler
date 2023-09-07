describe('Landing Page', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('has correct content', () => {
        cy.get('[data-cy="title"]').should('contain', 'Chess Dojo Scoreboard');
        cy.get('[data-cy="subtitle"]').should(
            'contain',
            'A structured plan to hold yourself accountable and a group to do it with'
        );
    });

    it('has sign in with google button', () => {
        cy.contains('Sign in with Google').click();

        cy.origin('https://accounts.google.com', () => {
            cy.url().should('contain', 'accounts.google.com');
        });
    });

    it('has sign in with email button', () => {
        cy.contains('Continue with Email').click();

        cy.url().should('contain', '/signin');
    });

    it('should redirect unauthenticated user to landing', () => {
        cy.visit('/profile');

        cy.location('pathname').should('equal', '/');
    });

    it('redirects authenticated user to profile', () => {
        cy.loginByCognitoApi(
            'landingPage',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );

        cy.visit('/');

        cy.location('pathname').should('equal', '/profile');
    });
});
