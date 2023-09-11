describe('Sparring Positions Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.interceptApi('GET', '/requirements/ALL_COHORTS?scoreboardOnly=false').as(
            'requirementRequest'
        );

        cy.visit('/material?view=sparring');
        cy.wait('@requirementRequest');
    });

    it('should have correct sections', () => {
        [
            'Middlegame Win Conversions',
            'Middlegame Sparring',
            'Endgame Algorithms',
            'Endgame Win Conversions',
            'Endgame Positional Sparring',
            'Rook Endgame Progression',
        ].forEach((title) => cy.contains(title));
    });

    it('should have sections collapsed by default', () => {
        cy.contains('Extra Queen').should('not.exist');
    });

    it('should allow expanding sections', () => {
        cy.contains('Middlegame Win Conversions').click();
        cy.contains('600-700').click();

        cy.contains('Extra Queen');
        cy.get('cg-board');
    });

    it('should have buttons for copying', () => {
        cy.contains('Middlegame Win Conversions').click();
        cy.contains('600-700').click();

        cy.getBySel('position-fen-copy');
        cy.getBySel('position-challenge-url');
    });

    it('should allow copying FENs', () => {
        cy.contains('Middlegame Win Conversions').click();
        cy.contains('600-700').click();
        cy.getBySel('position-fen-copy').first().click();

        cy.window()
            .its('navigator.clipboard')
            .then((clip) => clip.readText())
            .should(
                'equal',
                '2r2rk1/pb1nbppp/1p2pn2/2pp4/3P1B2/2PBPN2/PP3PPP/RN1QR1K1 w - - 0 1'
            );
    });

    it('should allow copying Lichess URL', () => {
        cy.intercept('POST', 'https://lichess.org/api/challenge/open', {
            body: {
                challenge: {
                    url: 'https://lichess.org/test',
                },
            },
        }).as('lichessRequest');

        cy.contains('Middlegame Win Conversions').click();
        cy.contains('600-700').click();
        cy.getBySel('position-challenge-url').first().click();
        cy.wait('@lichessRequest');

        cy.window()
            .its('navigator.clipboard')
            .then((clip) => clip.readText())
            .should('equal', 'https://lichess.org/test');
    });
});
