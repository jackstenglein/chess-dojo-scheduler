const checkboxes = [
    'All Fields',
    'Display Name',
    'Discord Username',
    'Chess.com Username',
    'Lichess Username',
    'FIDE ID',
    'USCF ID',
    'ECF ID',
    'CFC ID',
    'DWZ ID',
    'ACF ID',
    'KNSB ID',
];

describe('Search Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/scoreboard/search');
    });

    it('has selector to change views', () => {
        cy.getBySel('scoreboard-view-selector').click();
        cy.contains('Statistics').click();

        cy.location('pathname').should('equal', '/scoreboard/stats');
    });

    it('has checkboxes for field searching', () => {
        cy.getBySel('search-field').should('have.length', checkboxes.length);
        cy.containsAll(checkboxes);
    });

    it('requires at least one field', () => {
        cy.getBySel('search-query').type('Test Account');
        cy.contains('All Fields').click();

        cy.contains('At least one search field is required');
    });

    it('shows correct table columns on search', () => {
        cy.getBySel('search-query').type('Test Account');

        cy.getBySel('search-results').contains('Test Account');
        cy.getBySel('search-results').containsAll(['Cohort', ...checkboxes.slice(1)]);

        cy.contains('All Fields').click();
        cy.contains('FIDE ID').click();
        cy.contains('ECF ID').click();

        cy.getBySel('search-results').find('.MuiDataGrid-columnHeader').should('have.length', 4);
        cy.getBySel('search-results').contains('Cohort');
        cy.getBySel('search-results').contains('Display Name');
        cy.getBySel('search-results').contains('FIDE ID');
        cy.getBySel('search-results').contains('ECF ID');
    });

    it('shows correct message when no results', () => {
        cy.getBySel('search-query').type('DOES_NOT_EXIST');

        cy.getBySel('search-results').contains('No rows');
    });
});
