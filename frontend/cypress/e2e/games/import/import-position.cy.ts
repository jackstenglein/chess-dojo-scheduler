const matchGamePath = /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/;

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
        const fen = 'r1b2r1k/4qp1p/p1Nppb1Q/4nP2/1p2P3/2N5/PPP4P/2KR1BR1 b - - 5 18';

        cy.getBySel('fen-entry').clear().type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', matchGamePath);

        cy.getBySel('tags').click();
        cy.contains(fen);
    });

    it('requires supported FEN', () => {
        const fen = 'super invalid';

        cy.getBySel('fen-entry').clear().type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('eq', '/games/import');
        cy.contains('Invalid FEN');
    });
});
