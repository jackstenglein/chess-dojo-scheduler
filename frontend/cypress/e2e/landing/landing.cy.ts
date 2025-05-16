describe('Landing Page', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('has correct content', () => {
        cy.getBySel('title').should('contain', 'Got Mated?Time to join ChessDojo!');
        cy.getBySel('subtitle').should(
            'contain',
            'A chess training plan for every level and a community to do it with.',
        );
        cy.get('img').should('be.visible');
    });

    it('has sign up button', () => {
        cy.contains('Join the Dojo').click();

        cy.location('pathname').should('equal', '/signup');
    });

    it('has explore button', () => {
        cy.contains('Explore the Program').click();

        cy.location('pathname').should('equal', '/');
    });

    it('should redirect unauthenticated user to landing', () => {
        cy.visit('/profile');

        cy.location('pathname').should('equal', '/');
    });

    it('redirects authenticated user to profile', () => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.visit('/');

        cy.location('pathname').should('equal', '/profile');
    });
});
