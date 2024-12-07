/** Matches the URL of a game page. */
export const gameUrlRegex = /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/;

/**
 * Deletes the game currently open in the browser.
 */
export function deleteCurrentGame() {
    cy.getBySel('underboard-button-settings').click();
    cy.getBySel('delete-game-button').click();
    cy.getBySel('delete-game-confirm-button').click();
    cy.location('pathname').should('equal', '/profile');
}

/**
 * Verifies that the game currently open in the browser has the provided
 * attributes.
 * @param white The name of the player with white.
 * @param black The name of the player with black.
 * @param lastMove The SAN of the last move.
 * @param lastMoveClock The clock times of the players on the last move.
 * @param lastMoveEmt The elapsed move time of the last move.
 * @param orientation The orientation of the board.
 */
export function verifyGame({
    white,
    black,
    lastMove,
    lastMoveClock,
    lastMoveEmt,
    orientation,
}: {
    white?: string;
    black?: string;
    lastMove?: string;
    lastMoveClock?: { white?: string; black?: string };
    lastMoveEmt?: string;
    orientation?: 'white' | 'black';
}) {
    cy.location('pathname').should('match', gameUrlRegex);

    if (white) {
        cy.getBySel(
            orientation === 'black' ? 'player-header-header' : 'player-header-footer',
        ).contains(white);
    }
    if (black) {
        cy.getBySel(
            orientation === 'black' ? 'player-header-footer' : 'player-header-header',
        ).contains(black);
    }
    if (lastMove) {
        cy.getBySel('pgn-text-move-button')
            .last()
            .should('contain.text', lastMove)
            .click({ force: true });

        if (lastMoveClock?.white) {
            cy.getBySel(
                orientation === 'black' ? 'player-header-header' : 'player-header-footer',
            ).contains(lastMoveClock.white);
        }
        if (lastMoveClock?.black) {
            cy.getBySel(
                orientation === 'black' ? 'player-header-footer' : 'player-header-header',
            ).contains(lastMoveClock.black);
        }
    }
    if (lastMoveEmt) {
        cy.getBySel('elapsed-move-time').last().should('have.text', lastMoveEmt);
    }
}

/**
 * Finds the import button (ImportButton) and clicks it.
 * All import forms use this for consistency and ease of testing.
 */
export function clickImport() {
    return cy.getBySel('import-button').click();
}
