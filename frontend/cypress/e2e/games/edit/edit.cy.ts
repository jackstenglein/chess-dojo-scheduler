const LICHESS_CHAPTER_URL = 'https://lichess.org/study/W67VW7nM/3wugVXBW';
const LICHESS_STUDY_URL = 'https://lichess.org/study/W67VW7nM';
const LICHESS_CHAPTER_MISSING_DATA_URL = 'https://lichess.org/study/W67VW7nM/lsJkNwwR';

const PGN = `[Event "DojoScoreboard Cypress Study: Chapter 1"]
[Site "https://lichess.org/study/W67VW7nM/3wugVXBW"]
[Date "2024.01.07"]
[White "Test1"]
[Black "Test2"]
[Result "1-0"]
[WhiteElo "1300"]
[BlackElo "1400"]
[UTCDate "2024.01.08"]
[UTCTime "01:53:00"]
[Variant "Standard"]
[ECO "B00"]
[Opening "King's Pawn Game"]
[Annotator "https://lichess.org/@/JackStenglein"]

1. e4 1-0


`;

const INVALID_PGN = `[Event "DojoScoreboard Cypress Study: Chapter 1"]
[Site "https://lichess.org/study/W67VW7nM/3wugVXBW"]
[Date "2024.01.07"]
[White "Test1"]
[Black "Test2"]
[Result "1-0"]
[WhiteElo "1300"]
[BlackElo "1400"]
[UTCDate "2024.01.08"]
[UTCTime "01:53:00"]
[Variant "Standard"]
[ECO "B00"]
[Opening "King's Pawn Game"]
[Annotator "https://lichess.org/@/JackStenglein"]

1. e4 White Wins


`;

function deleteCurrentGame() {
    cy.getBySel('settings').click();
    cy.getBySel('delete-game-button').click();
    cy.getBySel('delete-game-confirm-button').click();
    cy.location('pathname').should('equal', '/profile');
}

describe('Edit Games Page', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'games',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/games/submit');
    });

    it('requires Lichess chapter URL to submit', () => {
        cy.interceptApi('POST', '/game', { statusCode: 403 });

        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess chapter URL format');

        cy.getBySel('lichess-chapter-url').type('hello, world!');
        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess chapter URL format');

        cy.getBySel('lichess-chapter-url')
            .find('input')
            .clear()
            .type(LICHESS_CHAPTER_URL);
        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess chapter URL format').should('not.exist');
    });

    it('requires Lichess study URL to bulk submit', () => {
        cy.interceptApi('POST', '/game', { statusCode: 403 });
        cy.contains('Bulk Import from Lichess Study').click();

        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess study URL format');

        cy.getBySel('lichess-study-url').type('hello, world!');
        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess study URL format');

        cy.getBySel('lichess-study-url').find('input').clear().type(LICHESS_STUDY_URL);
        cy.getBySel('submit').click();
        cy.contains('Does not match the Lichess study URL format').should('not.exist');
    });

    it('requires PGN to submit manual entry', () => {
        cy.contains('Manual Entry').click();
        cy.getBySel('submit').click();

        cy.contains('This field is required');
    });

    it('submits from manual entry', () => {
        cy.contains('Manual Entry').click();
        cy.getBySel('pgn-text').type(PGN);
        cy.getBySel('submit').click();

        cy.location('pathname').should('match', /^\/games\/\d{4}-\d{4}\/.+$/);
        cy.getBySel('player-header-header').contains('Test2');
        cy.getBySel('player-header-footer').contains('Test1');
        cy.contains('e4');

        deleteCurrentGame();
    });

    it('submits from Lichess chapter URL', () => {
        cy.getBySel('lichess-chapter-url').type(LICHESS_CHAPTER_URL);
        cy.getBySel('submit').click();

        cy.location('pathname').should(
            'match',
            /^\/games\/\d{4}-\d{4}\/\d{4}\.\d{2}\.\d{2}_.+$/
        );
        cy.getBySel('player-header-header').contains('Test2');
        cy.getBySel('player-header-footer').contains('Test1');
        cy.contains('e4');

        deleteCurrentGame();
    });

    it('submits with correct default orientation', () => {
        cy.getBySel('lichess-chapter-url').type(LICHESS_CHAPTER_URL);
        cy.contains('Black').click();
        cy.getBySel('submit').click();

        cy.location('pathname').should(
            'match',
            /^\/games\/\d{4}-\d{4}\/\d{4}\.\d{2}\.\d{2}_.+$/
        );
        cy.getBySel('player-header-header').contains('Test1');
        cy.getBySel('player-header-footer').contains('Test2');
        cy.contains('e4');

        deleteCurrentGame();
    });

    it('requires all data in preflight', () => {
        cy.getBySel('lichess-chapter-url').type(LICHESS_CHAPTER_MISSING_DATA_URL);
        cy.getBySel('submit').click();

        cy.getBySel('white-0').type('Test3');
        cy.getBySel('black-0').type('Test4');
        cy.getBySel('submit-preflight').click();
        cy.get('#date-0-helper-text').contains('This field is required');

        cy.get('#date-0').type('01072024');
        cy.getBySel('white-0').find('input').clear();
        cy.getBySel('submit-preflight').click();
        cy.getBySel('white-0').contains('This field is required');

        cy.getBySel('white-0').type('Test3');
        cy.getBySel('black-0').find('input').clear();
        cy.getBySel('submit-preflight').click();
        cy.getBySel('black-0').contains('This field is required');
    });

    it('gets required data through preflight', () => {
        cy.getBySel('lichess-chapter-url').type(LICHESS_CHAPTER_MISSING_DATA_URL);
        cy.getBySel('submit').click();

        cy.getBySel('white-0').type('Test3');
        cy.getBySel('black-0').type('Test4');
        cy.get('#date-0').type('01072024');
        cy.getBySel('submit-preflight').click();

        cy.location('pathname').should(
            'match',
            /^\/games\/\d{4}-\d{4}\/\d{4}\.\d{2}\.\d{2}_.+$/
        );
        cy.getBySel('player-header-header').contains('Test4');
        cy.getBySel('player-header-footer').contains('Test3');
        cy.contains('d4');

        deleteCurrentGame();
    });

    it('shows preflight for studies', () => {
        cy.contains('Bulk Import from Lichess Study').click();
        cy.getBySel('lichess-study-url').type(LICHESS_STUDY_URL);
        cy.getBySel('submit').click();

        cy.getBySel('white-0').find('input').should('have.value', 'Test1');
        cy.getBySel('black-0').find('input').should('have.value', 'Test2');
        cy.get('#date-0').should('have.value', '01/07/2024');

        cy.getBySel('white-1');
        cy.getBySel('black-1');
        cy.get('#date-1');
    });

    it('bulk submits studies', () => {
        cy.contains('Bulk Import from Lichess Study').click();
        cy.getBySel('lichess-study-url').type(LICHESS_STUDY_URL);
        cy.getBySel('submit').click();

        cy.getBySel('white-1').type('Test3');
        cy.getBySel('black-1').type('Test4');
        cy.get('#date-1').type('01072024');
        cy.getBySel('submit-preflight').click();
        cy.location('pathname').should('equal', '/profile');

        cy.get('.MuiDataGrid-row').first().contains('Test1 (1300)');
        cy.get('.MuiDataGrid-row').first().contains('Test2 (1400)');
        cy.get('.MuiDataGrid-row').first().click();
        cy.location('pathname').should(
            'match',
            /^\/games\/\d{4}-\d{4}\/\d{4}\.\d{2}\.\d{2}_.+$/
        );
        cy.getBySel('player-header-header').contains('Test2');
        cy.getBySel('player-header-footer').contains('Test1');
        cy.contains('e4');
        deleteCurrentGame();

        cy.get('.MuiDataGrid-row').first().contains('Test3 (??)');
        cy.get('.MuiDataGrid-row').first().contains('Test4 (??)');
        cy.get('.MuiDataGrid-row').first().click();
        cy.location('pathname').should(
            'match',
            /^\/games\/\d{4}-\d{4}\/\d{4}\.\d{2}\.\d{2}_.+$/
        );
        cy.getBySel('player-header-header').contains('Test4');
        cy.getBySel('player-header-footer').contains('Test3');
        cy.contains('d4');
        deleteCurrentGame();
    });

    it('displays error page on invalid PGN', () => {
        cy.contains('Manual Entry').click();
        cy.getBySel('pgn-text').type(INVALID_PGN);
        cy.getBySel('submit').click();

        cy.location('pathname').should('equal', '/games/submit');
        cy.getBySel('error-snackbar').contains('Invalid PGN');
    });
});
