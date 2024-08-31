describe('Directories', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'profile',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/profile?view=files');
    });

    it('displays empty home directory', () => {
        cy.contains('Home');
        cy.contains('No rows');
    });

    it('links to game import page', () => {
        cy.contains('Add').click();
        cy.contains('New Game').should(
            'have.attr',
            'href',
            '/games/import?directory=home',
        );
    });

    it('displays new directory dialog', () => {
        cy.contains('Add').click();
        cy.contains('New Folder').click();

        cy.getBySel('update-directory-form').should('be.visible');
    });

    it('requires name to create new directory', () => {
        cy.contains('Add').click();
        cy.contains('New Folder').click();
        cy.getBySel('update-directory-save-button').should('be.disabled');

        cy.getBySel('update-directory-name').type('Test');
        cy.getBySel('update-directory-save-button').should('be.enabled');
    });

    it('requires name to be <= 100 characters', () => {
        cy.contains('Add').click();
        cy.contains('New Folder').click();
        cy.getBySel('update-directory-save-button').should('be.disabled');

        cy.getBySel('update-directory-name').type('A');
        cy.getBySel('update-directory-save-button').should('be.enabled');

        for (let i = 0; i < 10; i++) {
            cy.getBySel('update-directory-name').type('AAAAAAAAAA');
        }
        cy.getBySel('update-directory-save-button').should('be.disabled');
        cy.contains('101 / 100 characters');
    });

    it('requires confirmation to delete directory', () => {
        cy.interceptApi('GET', '/directory/398ee7df-13a1-4fbf-bae3-e156f252512d/home', {
            fixture: 'profile/directories/basic.json',
        });

        cy.getBySel('directories-data-grid')
            .contains(':not(.MuiDataGrid-rowReorderCellPlaceholder)', 'Test')
            .rightclick();
        cy.contains('Delete').click();
        cy.getBySel('delete-directory-form').should('be.visible');

        cy.getBySel('delete-directory-button').should('be.disabled');
        cy.getBySel('delete-directory-confirm').type('DeLeTe');
        cy.getBySel('delete-directory-button').should('be.enabled');
    });

    it('creates and deletes directory', () => {
        cy.contains('Add').click();
        cy.contains('New Folder').click();
        cy.getBySel('update-directory-name').type('Test');
        cy.getBySel('update-directory-save-button').click();
        cy.getBySel('update-directory-form').should('not.exist');

        cy.getBySel('directories-data-grid')
            .contains(':not(.MuiDataGrid-rowReorderCellPlaceholder)', 'Test')
            .rightclick();
        cy.contains('Delete').click();
        cy.getBySel('delete-directory-form').should('be.visible');

        cy.getBySel('delete-directory-confirm').type('DeLeTe');
        cy.getBySel('delete-directory-button').click();
        cy.getBySel('delete-directory-form').should('not.exist');

        cy.getBySel('directories-data-grid').contains('No rows');
    });

    it('displays move directory dialog', () => {
        cy.interceptApi('GET', '/directory/398ee7df-13a1-4fbf-bae3-e156f252512d/home', {
            fixture: 'profile/directories/basic.json',
        });

        cy.getBySel('directories-data-grid')
            .contains(':not(.MuiDataGrid-rowReorderCellPlaceholder)', 'Test')
            .rightclick();
        cy.contains('Move').click();

        cy.getBySel('move-directory-form').should('be.visible');
    });

    it('disables renaming directory to empty/same name', () => {
        cy.interceptApi('GET', '/directory/398ee7df-13a1-4fbf-bae3-e156f252512d/home', {
            fixture: 'profile/directories/basic.json',
        });

        cy.getBySel('directories-data-grid')
            .contains(':not(.MuiDataGrid-rowReorderCellPlaceholder)', 'Test')
            .rightclick();
        cy.contains('Edit Name/Visibility').click();

        cy.getBySel('update-directory-name').clear();
        cy.getBySel('update-directory-save-button').should('be.disabled');
        cy.getBySel('update-directory-name').type('Test');
        cy.getBySel('update-directory-save-button').should('be.disabled');
        cy.getBySel('update-directory-name').type('2');

        cy.getBySel('update-directory-save-button').should('be.enabled');
    });
});
