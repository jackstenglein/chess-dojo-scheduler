import { clickImport } from './helpers';

describe('Import Games Page - Custom Position', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games/import');
        cy.getBySel('import-custom-position').click();
    });

    it('submits with default FEN', () => {
        clickImport();

        cy.location('pathname').should('equal', '/games/analysis');
    });

    it('submits with custom FEN', () => {
        const fen = 'r1b2r1k/4qp1p/p1Nppb1Q/4nP2/1p2P3/2N5/PPP4P/2KR1BR1 b - - 5 18';

        cy.getBySel('position-entry').clear();
        cy.getBySel('position-entry').type(fen);
        cy.getBySel('position-entry').type('{enter}');
        clickImport();

        cy.location('pathname').should('equal', '/games/analysis');

        cy.getBySel('underboard-button-tags').click();
        cy.contains(fen);
    });
});
