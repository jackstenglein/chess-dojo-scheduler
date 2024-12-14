import { clickImport, verifyGame } from './helpers';

function importPgnText(pgn: string) {
    cy.getBySel('pgn-text').type(pgn);
    clickImport();
    cy.location('pathname').should('equal', '/games/analysis');
}

describe('Import Games Page - PGN Text', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games/import');
        cy.getBySel('import-pgn-text').click();
    });

    it('requires PGN to submit manual entry', () => {
        clickImport();

        cy.contains('One field is required');
    });

    it('submits from manual entry (full)', () => {
        cy.fixture<string>('games/pgns/valid.txt').then((pgn) => {
            importPgnText(pgn);
            verifyGame({ white: 'Test1', black: 'Test2', lastMove: 'e4' });
        });
    });

    it('submits from manual entry (headers only)', () => {
        cy.fixture<string>('games/pgns/headers-only.txt').then((pgn) => {
            importPgnText(pgn);
            verifyGame({ white: 'bestieboots', black: 'test2' });
        });
    });

    it('submits from manual entry (moves only)', () => {
        cy.fixture<string>('games/pgns/moves-only.txt').then((pgn) => {
            importPgnText(pgn);
            verifyGame({ lastMove: 'a4' });
        });
    });

    it('displays error snackbar on invalid PGN', () => {
        cy.fixture<string>('games/pgns/invalid.txt').then((pgn) => {
            cy.getBySel('pgn-text').type(pgn);
            clickImport();

            cy.location('pathname').should('equal', '/games/import');
            cy.getBySel('error-snackbar').contains('Invalid PGN');
        });
    });
});
