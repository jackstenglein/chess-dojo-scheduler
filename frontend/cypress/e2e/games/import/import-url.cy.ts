import testURLs from '../../../fixtures/games/urls.json';

function deleteCurrentGame() {
    cy.getBySel('settings').click();
    cy.getBySel('delete-game-button').click();
    cy.getBySel('delete-game-confirm-button').click();
    cy.location('pathname').should('equal', '/profile');
}

function testImport(
    url: string,
    lastMove?: string,
    clockTest?: { clockForWhite: string },
) {
    cy.getBySel('online-game-url').type(url);
    cy.getBySel('submit').click();

    cy.location('pathname').should(
        'match',
        /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/,
    );

    if (lastMove) {
        cy.getBySel('pgn-text-move-button').last().should('have.text', lastMove).click();

        if (clockTest) {
            const { clockForWhite } = clockTest;
            cy.contains(clockForWhite);
        }
    }

    deleteCurrentGame();
}

describe('Import Games Page - Import by URLs', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
    });

    it('Requires valid URL', () => {
        cy.interceptApi('POST', '/game', { statusCode: 403 });

        cy.getBySel('submit').click();
        cy.contains('URL is required.');

        cy.getBySel('online-game-url')
            .clear()
            .type('hello, world!')
            .type(testURLs.lichess_chapter);
        cy.getBySel('submit').click();
        cy.contains('The provided URL is unsupported');
    });

    it('submits from Lichess chapter URL', () => {
        cy.getBySel('online-game-url').type(testURLs.lichess_chapter);
        cy.getBySel('submit').click();
        cy.getBySel('player-header-header').contains('Test2');
        cy.getBySel('player-header-footer').contains('Test1');
        cy.contains('e4');

        deleteCurrentGame();
    });

    it.skip('bulk submits studies', () => {
        cy.getBySel('online-game-url').type(testURLs.lichess_study);
        cy.getBySel('submit').click();

        cy.getBySel('white-1').type('Test3');
        cy.getBySel('black-1').type('Test4');
        cy.getBySel('result-1').click();
        cy.contains('Black Won').click();
        cy.get('#date-1').type('01072024');
        cy.getBySel('submit-preflight').click();
        cy.location('pathname').should('equal', '/profile');

        cy.contains('Test1 (1300)');
        cy.contains('Test2 (1400)');
        cy.contains('Test3 (??)');
        cy.contains('Test4 (??)');

        cy.get('.MuiDataGrid-row').first().click();
        cy.location('pathname').should(
            'match',
            /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/,
        );
        deleteCurrentGame();

        cy.get('.MuiDataGrid-row').first().click();
        cy.location('pathname').should(
            'match',
            /^\/games\/\d{3,4}-\d{3,4}\/\d{4}\.\d{2}\.\d{2}_.+$/,
        );
        deleteCurrentGame();
    });

    it('submits from Lichess game URL', () => {
        testImport(testURLs.lichess_game, 'Rxd6#', {
            clockForWhite: '0:17:37',
        });
    });

    it('submits from Chess.com game URL', () => {
        testImport(testURLs.chesscom_game, 'Kxh4', {
            clockForWhite: '0:04:14',
        });
    });

    it('submits from Chess.com annotations URL', () => {
        testImport(testURLs.chesscom_analysis_a, 'Nxb6');
    });

    it('submits from Chess.com analysis URL', () => {
        testImport(testURLs.chesscom_analysis_game, 'Nf3');
    });

    it('submits from a Lichess chapter URL with missing headers successfully', () => {
        testImport(testURLs.lichess_chapter_missing_data, 'd4');
    });
});
