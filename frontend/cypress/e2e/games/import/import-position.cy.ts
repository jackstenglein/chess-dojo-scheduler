const matchGamePath = /^\/games\/\d{3,4}-\d{3,4}\/.+$/;

const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('Import Games Page - Position', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
        cy.contains('Position').click();
    });

    it('submits with default FEN', () => {
        cy.getBySel('submit').click();
        cy.location('pathname').should('match', matchGamePath);

        cy.getBySel('tags').click();
        cy.contains(startingPosition);
    });

    it('submits with custom FEN', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

        cy.getBySel('fen-entry').type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', matchGamePath);

        cy.getBySel('tags').click();
        cy.contains(fen);
    });

    it('requires supported FEN', () => {
        const fen = 'super invalid';

        cy.getBySel('fen-entry').type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('equal', '/games/import');
        cy.getBySel('error-snackbar').contains('Invalid FEN');
    });

    it('requires a FEN', () => {
        cy.getBySel('fen-entry').clear().type('  ');
        cy.getBySel('submit').click();
        cy.getBySel('error-snackbar').contains('Fen is required');
    });
});
