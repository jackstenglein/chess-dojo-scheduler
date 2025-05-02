describe('Info Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/tournaments/liga?type=info');
    });

    it('has tab selector', () => {
        cy.getBySel('tournaments-tab-list').contains('Calendar').click();

        cy.location().should((loc) => {
            expect(loc.pathname).to.eq('/tournaments/liga');
            expect(loc.search).to.eq('?type=calendar');
        });
    });

    it('has correct content', () => {
        cy.contains('Welcome to the DojoLiga');
        cy.contains('Registration Info');
        cy.contains('Leaderboard Info');
    });

    it('links to Lichess team', () => {
        cy.getBySel('lichess-team-link').should(
            'have.attr',
            'href',
            'https://lichess.org/team/chessdojo',
        );
    });

    it('links to Chess.com team', () => {
        cy.getBySel('chesscom-team-link').should(
            'have.attr',
            'href',
            'https://www.chess.com/club/chessdojo',
        );
    });

    it('links to Discord server', () => {
        cy.getBySel('discord-invite-link').should(
            'have.attr',
            'href',
            'https://discord.gg/AEeHwBWqAX',
        );
    });
});
