import testURLs from '../../../fixtures/games/urls.json';
import { deleteCurrentGame, gameUrlRegex, verifyGame } from './helpers';

function importUrl(url: string) {
    cy.getBySel('online-game-url').type(url);
    cy.getBySel('submit').click();
    cy.location('pathname').should('match', gameUrlRegex);
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
        importUrl(testURLs.lichess_chapter);
        verifyGame({ white: 'Test1', black: 'Test2', lastMove: 'e4' });
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
        importUrl(testURLs.lichess_game);
        verifyGame({
            white: 'Sokrates1975',
            black: 'bestieboots',
            lastMove: 'Rxd6#',
            lastMoveClock: {
                white: '0:17:37',
                black: '0:10:28',
            },
        });
        deleteCurrentGame();
    });

    it('submits from Lichess game URL without color', () => {
        importUrl(testURLs.lichess_game_no_color);
        verifyGame({
            white: 'Sokrates1975',
            black: 'bestieboots',
            lastMove: 'Rxd6#',
            lastMoveClock: {
                white: '0:17:37',
                black: '0:10:28',
            },
        });
        deleteCurrentGame();
    });

    it('submits from a Lichess chapter URL with missing headers successfully', () => {
        importUrl(testURLs.lichess_chapter_missing_data);
        verifyGame({
            lastMove: 'd4',
        });
        deleteCurrentGame();
    });

    it('submits from Chess.com game URL', () => {
        importUrl(testURLs.chesscom_game);
        verifyGame({
            white: 'bestieboots',
            black: 'NVWV1',
            lastMove: 'Kxh4',
            lastMoveClock: {
                white: '0:04:14',
                black: '0:02:54',
            },
        });
        deleteCurrentGame();
    });

    it('submits from Chess.com annotations URL', () => {
        importUrl(testURLs.chesscom_analysis_a);
        verifyGame({
            lastMove: 'Nxb6',
        });
        deleteCurrentGame();
    });

    it('submits from Chess.com analysis URL', () => {
        importUrl(testURLs.chesscom_analysis_game);
        verifyGame({
            white: 'bestieboots',
            black: 'David71401',
            lastMove: 'Nf3',
            lastMoveClock: {
                white: '0:08:14',
                black: '0:09:05',
            },
        });
        deleteCurrentGame();
    });
});
