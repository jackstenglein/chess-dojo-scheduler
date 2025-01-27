describe('Training Plan', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/profile?view=progress');
    });

    it('displays task history', () => {
        cy.get('#Tactics-header').click();

        cy.getBySel('progress-category-Tactics')
            .find('[data-cy="update-task-button"]')
            .first()
            .click();

        cy.getBySel('task-updater-show-history-button').click();

        cy.getBySel('task-updater-save-button').click();
    });
});
