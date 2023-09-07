describe('Signup Page', () => {
    beforeEach(() => {
        cy.visit('/signup');
    });

    it('has correct content', () => {
        cy.getBySel('title').should('have.text', 'Chess Dojo Scoreboard');
        cy.getBySel('subtitle').should('have.text', 'Create Account');
    });

    it('should link to signin', () => {
        cy.getBySel('signin-button').click();

        cy.location('pathname').should('equal', '/signin');
    });

    it('requires name to submit form', () => {
        cy.get('#email').type('test@email.com');
        cy.get('#password').type('testpassword');

        cy.getBySel('submit-button').click();

        cy.get('#name-helper-text').should('have.text', 'Name is required');
    });

    it('requires email to submit form', () => {
        cy.get('#name').type('Test Name');
        cy.get('#password').type('testpassword');

        cy.getBySel('submit-button').click();

        cy.get('#email-helper-text').should('have.text', 'Email is required');
    });

    it('requires password to submit form', () => {
        cy.get('#name').type('Test Name');
        cy.get('#email').type('test@email.com');

        cy.getBySel('submit-button').click();

        cy.get('#password-helper-text').should('have.text', 'Password is required');
    });

    it('redirects to email verification after submit', () => {
        cy.get('#name').type('Test Name');
        cy.get('#email').type('test@email.com');
        cy.get('#password').type('testpassword');

        cy.getBySel('submit-button').click();

        cy.location('pathname').should('equal', '/verify-email');
    });
});
