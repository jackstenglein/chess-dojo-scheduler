import {
    cancelPreflight,
    clickImport,
    deleteCurrentGame,
    gameUrlRegex,
    verifyGame,
} from './helpers';

const testUrls = {
    lichessChapter: 'https://lichess.org/study/W67VW7nM/3wugVXBW',
    lichessStudy: 'https://lichess.org/study/W67VW7nM',
    lichessGame: 'https://lichess.org/mN1qj7pP/black',
    lichessGameNoColor: 'https://lichess.org/mN1qj7pP/',
    lichessChapterMissingData: 'https://lichess.org/study/W67VW7nM/lsJkNwwR',
    lichessGameFromPosition: 'https://lichess.org/XdWMCVrNX6No',
    chesscomAnalysisA: 'https://www.chess.com/a/2eUTHynZc2Jtfx?tab=analysis',
    chesscomAnalysisB: 'https://www.chess.com/analysis/game/pgn/3PQmunBaE2?tab=analysis',

    chesscomAnalysisGame:
        'https://www.chess.com/analysis/game/live/108036079387?tab=review',
    chesscomGame: 'https://www.chess.com/game/live/107855985867',
};

function importUrl(url: string) {
    cy.getBySel('online-game-url').type(url);
    clickImport();
    cy.location('pathname').should('match', gameUrlRegex);
}

describe('Import Games Page - Import Online Games', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password'),
        );
        cy.visit('/games/import');
        cy.clock(new Date('2024-05-26'));
        cy.getBySel('import-online-game').click();
    });

    it('Requires valid URL', () => {
        cy.interceptApi('POST', '/game', { statusCode: 403 });

        clickImport();
        cy.contains('URL is required');

        cy.getBySel('online-game-url')
            .clear()
            .type('hello, world!')
            .type(testUrls.lichessChapter);
        clickImport();
        cy.contains('The provided URL is unsupported');
    });

    it('submits from Lichess chapter URL', () => {
        importUrl(testUrls.lichessChapter);
        verifyGame({ white: 'Test1', black: 'Test2', lastMove: 'e4' });
        deleteCurrentGame();
    });

    it('submits from Lichess game URL', () => {
        importUrl(testUrls.lichessGame);
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
        importUrl(testUrls.lichessGameNoColor);
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
        importUrl(testUrls.lichessChapterMissingData);
        cancelPreflight();

        verifyGame({
            lastMove: 'd4',
        });
        deleteCurrentGame();
    });

    it('submits from Chess.com game URL', () => {
        importUrl(testUrls.chesscomGame);
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

    it('submits from Chess.com annotations URL (type A)', () => {
        importUrl(testUrls.chesscomAnalysisA);

        // This particular analysis is missing headers
        cancelPreflight();

        verifyGame({
            lastMove: 'Nxb6',
        });

        deleteCurrentGame();
    });

    it('submits from Chess.com annotations URL (type B)', () => {
        importUrl(testUrls.chesscomAnalysisB);
        verifyGame({
            white: 'Test1',
            black: 'Test2',
            lastMove: 'e4',
        });
        deleteCurrentGame();
    });

    it('submits from Chess.com analysis URL', () => {
        importUrl(testUrls.chesscomAnalysisGame);
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

    if (Cypress.env('cognito_username') === 'jackstenglein+test@gmail.com') {
        it('submits from Chess.com recent game', () => {
            cy.contains('othaluran').click();
            verifyGame({
                white: 'JackStenglein',
                black: 'othaluran',
                lastMove: 'Kxh8',
                lastMoveClock: {
                    white: '0:00:23',
                    black: '0:02:26',
                },
            });
            deleteCurrentGame();
        });
    } else {
        it('submits from Chess.com recent game', () => {
            cy.getBySel('recent-game-chesscomGame').should('exist').click();
            verifyGame({});
            deleteCurrentGame();
        });
    }

    it('submits Lichess game from position', () => {
        importUrl(testUrls.lichessGameFromPosition);
        verifyGame({
            white: 'lwierenga',
            black: 'JackStenglein',
            lastMove: 'Rf4+',
            lastMoveClock: {
                white: '15:36',
                black: '10:24',
            },
        });
        deleteCurrentGame();
    });
});
