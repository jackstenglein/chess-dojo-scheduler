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

    it('displays new directory dialog', () => {
        cy.contains('New Folder').click();

        cy.getBySel('new-directory-form').should('be.visible');
    });

    it('requires name to create new directory', () => {
        cy.contains('New Folder').click();
        cy.getBySel('new-directory-create-button').should('be.disabled');

        cy.getBySel('new-directory-name').type('Test');
        cy.getBySel('new-directory-create-button').should('be.enabled');
    });

    it('requires confirmation to delete directory', () => {
        cy.interceptApi('GET', '/directory/398ee7df-13a1-4fbf-bae3-e156f252512d/home', {
            fixture: 'profile/directories/basic.json',
        });

        cy.getBySel('directories-data-grid').contains('Test').rightclick();
        cy.contains('Delete').click();
        cy.getBySel('delete-directory-form').should('be.visible');

        cy.getBySel('delete-directory-button').should('be.disabled');
        cy.getBySel('delete-directory-confirm').type('DeLeTe');
        cy.getBySel('delete-directory-button').should('be.enabled');
    });

    it('creates and deletes directory', () => {
        cy.contains('New Folder').click();
        cy.getBySel('new-directory-name').type('Test');
        cy.getBySel('new-directory-create-button').click();
        cy.getBySel('new-directory-form').should('not.exist');

        cy.getBySel('directories-data-grid').contains('Test').rightclick();
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

        cy.getBySel('directories-data-grid').contains('Test').rightclick();
        cy.contains('Move').click();

        cy.getBySel('move-directory-form').should('be.visible');
    });

    it('disables renaming directory to empty/same name', () => {
        cy.interceptApi('GET', '/directory/398ee7df-13a1-4fbf-bae3-e156f252512d/home', {
            fixture: 'profile/directories/basic.json',
        });

        cy.getBySel('directories-data-grid').contains('Test').rightclick();
        cy.contains('Rename').click();

        cy.getBySel('directory-rename-new-name').clear();
        cy.getBySel('directory-rename-save-button').should('be.disabled');
        cy.getBySel('directory-rename-new-name').type('Test');
        cy.getBySel('directory-rename-save-button').should('be.disabled');
        cy.getBySel('directory-rename-new-name').type('2');

        cy.getBySel('directory-rename-save-button').should('be.enabled');
    });
});
