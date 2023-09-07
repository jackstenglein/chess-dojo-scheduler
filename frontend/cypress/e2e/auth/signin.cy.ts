const credentials = require('../../fixtures/auth/signinCredentials.json');

describe('Signin Page', () => {
    beforeEach(() => {
        cy.visit('/signin');
    });

    it('has correct content', () => {
        cy.get('[data-cy="title"]').should('have.text', 'Chess Dojo Scoreboard');
        cy.get('[data-cy="subtitle"]').should('have.text', 'Signin');
        cy.get('[data-cy="warning"]').should('contain', 'This account is separate');
    });

    it('should link to signup', () => {
        cy.get('[data-cy="signup-button"]').click();

        cy.location('pathname').should('equal', '/signup');
    });

    it('should link to forgot password', () => {
        cy.get('[data-cy="forgot-password-button"]').click();

        cy.location('pathname').should('equal', '/forgot-password');
    });

    it('has sign in with google button', () => {
        cy.contains('Sign in with Google').click();

        cy.origin('https://accounts.google.com', () => {
            cy.url().should('contain', 'accounts.google.com');
        });
    });

    it('requires email to submit form', () => {
        cy.get('#password').type('testpassword');

        cy.get('[data-cy="signin-button"]').click();

        cy.get('#email-helper-text').should('have.text', 'Email is required');
    });

    it('requires password to submit form', () => {
        cy.get('#email').type('test@email.com');

        cy.get('[data-cy="signin-button"]').click();

        cy.get('#password-helper-text').should('have.text', 'Password is required');
    });

    it('returns error for incorrect password', () => {
        cy.get('#email').type('test@email.com');
        cy.get('#password').type('testpassword');

        cy.get('[data-cy="signin-button"]').click();

        cy.get('#password-helper-text').should(
            'have.text',
            'Incorrect email or password'
        );
    });

    it('logs in with correct credentials', () => {
        cy.get('#email').type(credentials.email);
        cy.get('#password').type(credentials.password);

        cy.get('[data-cy="signin-button"]').click();

        cy.location('pathname').should('equal', '/profile');
    });
});
