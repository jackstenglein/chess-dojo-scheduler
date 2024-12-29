describe('Newsfeed Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/newsfeed');
    });

    it('loads when not a member of a club', () => {
        cy.getBySel('newsfeed-list').should('be.visible');
    });
});
