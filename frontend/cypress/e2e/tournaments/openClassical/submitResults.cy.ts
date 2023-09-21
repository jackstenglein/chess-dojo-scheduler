describe('Submit Results Page', () => {
    beforeEach(() => {
        cy.visit('/tournaments/open-classical/submit-results');
    });

    it('hides email for logged in users', () => {
        cy.loginByCognitoApi(
            'tournaments',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/tournaments/open-classical/submit-results');

        cy.getBySel('email').should('not.exist');
    });

    it('fetches game results from Lichess', () => {
        cy.getBySel('game-url').type('https://lichess.org/Mw461kKB9Rsq');
        cy.getBySel('game-url').find('input').blur();

        cy.getBySel('white')
            .find('input')
            .should('have.attr', 'value', 'shatterednirvana');
        cy.getBySel('black').find('input').should('have.attr', 'value', 'jackstenglein');
        cy.contains('Black Wins (0-1)');
    });

    it('requires email to submit', () => {
        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('white').type('shatterednirvana');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('email').contains('This field is required');
    });

    it('requires section to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('game-url').find('input').blur();
        cy.getBySel('white').type('shatterednirvana');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('section').contains('This field is required');
    });

    it('requires round to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('white').type('shatterednirvana');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('round').contains('This field is required');
    });

    it('requires game url to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('white').type('shatterednirvana');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('game-url').contains('This field is required');
    });

    it('requires white to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('white').contains('This field is required');
    });

    it('requires black to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('white').type('jackstenglein');

        cy.getBySel('result').click();
        cy.contains('Black Wins (0-1)').click();

        cy.getBySel('submit-button').click();

        cy.getBySel('black').contains('This field is required');
    });

    it('requires result to submit', () => {
        cy.getBySel('email').type('test@example.com');

        cy.getBySel('section').click();
        cy.contains('Section A').click();

        cy.getBySel('round').click();
        cy.contains('1').click();

        cy.getBySel('game-url').type('https://test.com');
        cy.getBySel('white').type('jackstenglein');
        cy.getBySel('black').type('jackstenglein');

        cy.getBySel('submit-button').click();

        cy.getBySel('result').contains('This field is required');
    });

    it('does not require URL when game is not played', () => {
        ['Did Not Play', 'White Forfeits', 'Black Forfeits'].forEach((result) => {
            cy.getBySel('result').click();
            cy.contains(result).click();

            cy.getBySel('submit-button').click();
            cy.getBySel('game-url')
                .contains('This field is required')
                .should('not.exist');
        });

        cy.getBySel('result').click();
        cy.contains('White Wins').click();

        cy.getBySel('submit-button').click();
        cy.getBySel('game-url').contains('This field is required').should('exist');
    });

    it('displays report option when player forfeits', () => {
        ['White Forfeits', 'Black Forfeits'].forEach((result) => {
            cy.getBySel('result').click();
            cy.contains(result).click();

            cy.getBySel('report-opponent').should('be.visible');
        });

        cy.getBySel('result').click();
        cy.contains('Did Not Play').click();
        cy.getBySel('report-opponent').should('not.exist');
    });
});
