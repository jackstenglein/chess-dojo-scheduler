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
        cy.getBySel('update-task-button').click();

        cy.getBySel('task-updater-show-history-button').click();

        cy.getBySel('task-updater-save-button').click();
    });
});
