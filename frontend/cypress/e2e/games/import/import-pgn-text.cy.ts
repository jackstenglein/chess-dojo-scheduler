function deleteCurrentGame() {
    cy.getBySel('settings').click();
    cy.getBySel('delete-game-button').click();
    cy.getBySel('delete-game-confirm-button').click();
    cy.location('pathname').should('equal', '/profile');
}

function testImportPGNText(
    pgn: string,
    lastMove?: string,
    playerHeader?: string,
    playerFooter?: string,
) {
    cy.contains('PGN').click();
    cy.getBySel('pgn-text').type(pgn);
    cy.getBySel('submit').click();

    cy.location('pathname').should('match', /^\/games\/\d{3,4}-\d{3,4}\/.+$/);

    if (playerHeader) {
        cy.getBySel('player-header-header').contains(playerHeader);
    }
    if (playerFooter) {
        cy.getBySel('player-header-footer').contains(playerFooter);
    }

    if (lastMove) {
        cy.getBySel('pgn-text-move-button').last().should('have.text', lastMove).click();
    }

    deleteCurrentGame();
}

describe('Import Games Page - PGN Text', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
        cy.getBySel('import-pgn-text').click();
    });

    it('requires PGN to submit manual entry', () => {
        cy.contains('PGN').click();
        cy.getBySel('submit').click();

        cy.contains('This field is required');
    });

    it('submits from manual entry (full)', () => {
        cy.fixture('games/pgns/valid.txt').then((pgn) => {
            testImportPGNText(pgn, 'e4', 'Test2', 'Test1');
        });
    });

    it('displays error snackbar on invalid PGN', () => {
        cy.fixture('games/pgns/invalid.txt').then((pgn) => {
            cy.contains('PGN').click();
            cy.getBySel('pgn-text').type(pgn);
            cy.getBySel('submit').click();

            cy.location('pathname').should('equal', '/games/import');
            cy.getBySel('error-snackbar').contains('Invalid PGN');
        });
    });
});
