describe('Landing Page', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('has correct content', () => {
        cy.getBySel('title').should('contain', 'ChessDojo Scoreboard');
        cy.getBySel('subtitle').should(
            'contain',
            'The ChessDojo Training Program offers structured training plans'
        );
        cy.get('img').should('be.visible');
    });

    it('has sign up button', () => {
        cy.getBySel('landing-page').contains('Sign Up for Free').click();

        cy.location('pathname').should('equal', '/signup');
    });

    it('has sign in button', () => {
        cy.getBySel('landing-page').contains('Sign In').click();

        cy.location('pathname').should('equal', '/signin');
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
