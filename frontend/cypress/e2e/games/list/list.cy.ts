describe('List Games Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/games');
    });

    it('has correct columns', () => {
        cy.getBySel('games-table').contains('Cohort');
        cy.getBySel('games-table').contains('Players');
        cy.getBySel('games-table').contains('Result');
        cy.getBySel('games-table').contains('Moves');
        cy.getBySel('games-table').contains('Date');
    });

    it('has submit game button', () => {
        cy.getBySel('submit-game-button').contains('Submit a Game');
        cy.getBySel('submit-game-button').click();

        cy.location('pathname').should('equal', '/games/submit');
    });

    it('blocks submit on free tier', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/games');

        cy.getBySel('submit-game-button').click();
        cy.getBySel('upsell-dialog').should('be.visible');
        cy.location('pathname').should('equal', '/games');
    });

    it('has link to full database', () => {
        cy.contains('Download full database (updated every 24 hours)').should(
            'have.attr',
            'href',
            'https://chess-dojo-prod-game-database.s3.amazonaws.com/dojo_database.zip'
        );
    });

    it('populates table with initial cohort', () => {
        cy.getBySel('games-table').contains('1500-1600');
        cy.getBySel('games-table').contains('JackStenglein');
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

        cy.getBySel('games-table').contains('1600-1700');
        cy.getBySel('games-table').contains('HumanStragedy');
        cy.location('search').should(
            'equal',
            '?type=cohort&cohort=1600-1700&startDate=&endDate='
        );
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
            '?type=player&player=JackStenglein&color=either&startDate=&endDate='
        );
    });

    it('allows searching by opening', () => {
        cy.contains('Search By Opening').click();
        cy.getBySel('cohort-select').should('not.be.visible');
        cy.getBySel('search-by-opening').within(() => {
            cy.getBySel('opening-eco').should('be.visible');
            cy.get('#opening-start-date').should('be.visible');
            cy.get('#opening-end-date').should('be.visible');
            cy.getBySel('opening-eco').type('B01');
        });
        cy.getBySel('opening-search-button').click();

        cy.location('search').should(
            'equal',
            '?type=opening&eco=B01&startDate=&endDate='
        );
        cy.getBySel('games-table').contains('CornerPawn');
    });

    it.only('allows searching current user uploads', () => {
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
});
