describe('Info Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'tournaments',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/tournaments?type=info');
    });

    it('has correct content', () => {
    
        cy.contains('Welcome to the DojoLiga', { timeout: 10000 });
        cy.contains('Registration Info', { timeout: 10000 });
        cy.contains('Leaderboard Info', { timeout: 10000 });
    });

    it('links to Lichess team', () => {
        
        cy.get('[data-cy="lichess-team-link"]', { timeout: 10000 }).should(
            'have.attr',
            'href',
            'https://lichess.org/team/chessdojo',
        );
    });

    it('links to Chess.com team', () => {
        
        cy.get('[data-cy="chesscom-team-link"]', { timeout: 10000 }).should(
            'have.attr',
            'href',
            'https://www.chess.com/club/chessdojo'
        );
    });

    it('links to Discord server', () => {
        // Ensure the selector is correct and element is present
        cy.get('[data-cy="discord-invite-link"]', { timeout: 10000 }).should(
            'have.attr',
            'href',
            'https://discord.gg/AEeHwBWqAX'
        );
    });
});

