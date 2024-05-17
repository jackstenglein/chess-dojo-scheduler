import { deleteCurrentGame, gameUrlRegex } from './helpers';

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
        cy.getBySel('by-fen').click();
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', gameUrlRegex);

        deleteCurrentGame();
    });

    it('submits with custom FEN', () => {
        const fen = 'r1b2r1k/4qp1p/p1Nppb1Q/4nP2/1p2P3/2N5/PPP4P/2KR1BR1 b - - 5 18';

        cy.getBySel('by-fen').click();
        cy.getBySel('fen-entry').clear().type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', gameUrlRegex);
        cy.getBySel('tags').click();
        cy.contains(fen);

        deleteCurrentGame();
    });

    it('requires supported FEN', () => {
        const fen = 'super invalid';

        cy.getBySel('by-fen').click();
        cy.getBySel('fen-entry').clear().type(fen);
        cy.getBySel('submit').click();

        cy.location('pathname').should('eq', '/games/import');
        cy.contains('Invalid FEN');
    });
});
