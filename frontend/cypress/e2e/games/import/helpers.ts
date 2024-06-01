/** Matches the URL of a game page. */
export const gameUrlRegex = /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/;

/**
 * Deletes the game currently open in the browser.
 */
export function deleteCurrentGame() {
    cy.getBySel('settings').click({ force: true });
    cy.getBySel('delete-game-button').click({ force: true });
    cy.getBySel('delete-game-confirm-button').click({ force: true });
    cy.location('pathname').should('equal', '/profile');
}

/**
 * Cancel the missing-data preflight
 */
export function cancelPreflight() {
    cy.getBySel('cancel-preflight').click().should('not.be.visible');
}

/**
 * Verifies that the game currently open in the browser has the provided
 * attributes.
 * @param white The name of the player with white.
 * @param black The name of the player with black.
 * @param lastMove The SAN of the last move.
 * @param lastMoveClock The clock times of the players on the last move.
 */
export function verifyGame({
    white,
    black,
    lastMove,
    lastMoveClock,
}: {
    white?: string;
    black?: string;
    lastMove?: string;
    lastMoveClock?: { white?: string; black?: string };
}) {
    cy.location('pathname').should('match', gameUrlRegex);

    if (white) {
        cy.getBySel('player-header-footer').contains(white);
    }
    if (black) {
        cy.getBySel('player-header-header').contains(black);
    }
    if (lastMove) {
        cy.getBySel('pgn-text-move-button')
            .last()
            .should('have.text', lastMove)
            .click({ force: true });

        if (lastMoveClock?.white) {
            cy.getBySel('player-header-footer').contains(lastMoveClock.white);
        }
        if (lastMoveClock?.black) {
            cy.getBySel('player-header-header').contains(lastMoveClock.black);
        }
    }
}

/**
 * Finds the import button (ImportButton) and clicks it.
 * All import forms use this for consistency and ease of testing.
 */
export function clickImport() {
    return cy.getBySel('import-button').click();
}
