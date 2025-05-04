describe('List Games Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games');
    });

    it('has correct columns', () => {
        cy.getBySel('games-table').contains('Cohort');
        cy.getBySel('games-table').contains('Players');
        cy.getBySel('games-table').contains('Result');
        cy.getBySel('games-table').contains('Played');
    });

    it('has import game button', () => {
        cy.getBySel('import-game-button').contains('Analyze a Game');
        cy.getBySel('import-game-button').click();

        cy.location('pathname').should('equal', '/games/import');
    });

    it('has link to full database', () => {
        cy.contains('Download full database (updated daily)').should(
            'have.attr',
            'href',
            'https://chess-dojo-prod-game-database.s3.amazonaws.com/dojo_database.zip',
        );
    });

    it('blocks link to full database on free tier', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/games');

        cy.contains('Download full database (updated daily)').should('not.have.attr', 'href');
        cy.contains('Download full database').click();
        cy.getBySel('upsell-dialog').should('be.visible');
    });

    it('populates table with initial cohort', () => {
        cy.getBySel('games-table').contains('15-1600');
    });

    it('allows searching by cohort by default', () => {
        cy.getBySel('search-by-cohort').within(() => {
            cy.getBySel('cohort-select').should('be.visible');
            cy.get('#cohort-start-date').should('be.visible');
            cy.get('#cohort-end-date').should('be.visible');
            cy.getBySel('cohort-search-button').should('be.visible');

            cy.getBySel('cohort-select').click();
        });

        cy.contains('1600-1700').click();
        cy.getBySel('cohort-search-button').click();

        cy.getBySel('games-table').contains('16-1700');
        cy.getBySel('games-table').contains('JackStenglein');
        cy.location('search').should('equal', '?type=cohort&cohort=1600-1700&startDate=&endDate=');
    });

    it('allows searching by player', () => {
        cy.contains('Search By Player').click();
        cy.getBySel('cohort-select').should('not.be.visible');
        cy.getBySel('search-by-player').within(() => {
            cy.getBySel('player-name').should('be.visible');
            cy.get('#player-start-date').should('be.visible');
            cy.get('#player-end-date').should('be.visible');
            cy.getBySel('player-name').type('JackStenglein');
        });
        cy.getBySel('player-search-button').click();

        cy.location('search').should(
            'equal',
            '?type=player&player=JackStenglein&color=either&startDate=&endDate=',
        );
    });

    it('prevents searching by player on free tier', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/games');

        cy.contains('Search By Player').click();
        cy.getBySel('player-search-button').should('be.disabled');
        cy.getBySel('search-by-player').contains(
            'Free-tier users are not able to search by player name',
        );
    });

    it('prevents searching by player through URL', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/games?type=player&player=JackStenglein&color=either&startDate=&endDate=');

        cy.getBySel('upsell-dialog').should('be.visible');
    });

    it('allows searching by eco', () => {
        cy.contains('Search By Opening').click();
        cy.getBySel('cohort-select').should('not.be.visible');
        cy.getBySel('search-by-opening').within(() => {
            cy.getBySel('opening-eco').should('be.visible');
            cy.get('#opening-start-date').should('be.visible');
            cy.get('#opening-end-date').should('be.visible');
            cy.getBySel('opening-eco').type('B01');
        });
        cy.getBySel('opening-search-button').click();

        cy.location('search').should('equal', '?type=opening&eco=B01&startDate=&endDate=');
        cy.getBySel('games-table').should('not.contain', 'No rows');
    });

    it('allows searching current user uploads', () => {
        cy.contains('Search My Uploads').click();
        cy.getBySel('cohort-select').should('not.be.visible');
        cy.getBySel('search-by-owner').within(() => {
            cy.getBySel('owner-search-description').should('be.visible');
            cy.get('#owner-start-date').should('be.visible');
            cy.get('#owner-end-date').should('be.visible');
        });
        cy.getBySel('owner-search-button').click();

        cy.location('search').should('equal', '?type=owner&startDate=&endDate=');
    });

    it.only('links to game page on row click', () => {
        cy.getBySel('games-table').find('.MuiDataGrid-main--hiddenContent').should('not.exist');
        cy.getBySel('games-table').find('.MuiDataGrid-row').first().click();

        cy.location('pathname').should('match', /^\/games\/\d{4}-\d{4}\/.+$/);
    });

    it('blocks pagination on free tier', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/games');

        cy.getBySel('upsell-alert').should('be.visible');
        cy.get('[aria-label="Go to next page"]').should('be.disabled');
    });
});
