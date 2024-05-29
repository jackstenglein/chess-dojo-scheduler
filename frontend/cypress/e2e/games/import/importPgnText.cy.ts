import { clickImport, deleteCurrentGame, gameUrlRegex, verifyGame } from './helpers';

function importPgnText(pgn: string) {
    cy.getBySel('pgn-text').type(pgn);
    clickImport();
    cy.location('pathname').should('match', gameUrlRegex);
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
        clickImport();

        cy.contains('One field is required');
    });

    it('submits from manual entry (full)', () => {
        cy.fixture('games/pgns/valid.txt').then((pgn) => {
            importPgnText(pgn);
            verifyGame({ white: 'Test1', black: 'Test2', lastMove: 'e4' });
            deleteCurrentGame();
        });
    });

    it('submits from manual entry (headers only)', () => {
        cy.fixture('games/pgns/headers-only.txt').then((pgn) => {
            importPgnText(pgn);
            cy.getBySel('cancel-preflight').click();
            verifyGame({ white: 'bestieboots', black: 'test2' });
            deleteCurrentGame();
        });
    });

    it('submits from manual entry (moves only)', () => {
        cy.fixture('games/pgns/moves-only.txt').then((pgn) => {
            importPgnText(pgn);
            cy.getBySel('cancel-preflight').click();
            verifyGame({ lastMove: 'a4' });
            deleteCurrentGame();
        });
    });

    it('displays error snackbar on invalid PGN', () => {
        cy.fixture('games/pgns/invalid.txt').then((pgn) => {
            cy.getBySel('pgn-text').type(pgn);
            clickImport();

            cy.location('pathname').should('equal', '/games/import');
            cy.getBySel('error-snackbar').contains('Invalid PGN');
        });
    });
});
