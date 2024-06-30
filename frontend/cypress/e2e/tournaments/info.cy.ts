describe('Info Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'tournaments',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password')
        );
        cy.visit('/tournaments?type=info');
    });

    it('has tab selector', () => {
        cy.getBySel('tournaments-tab-list').contains('Calendar').click();

        cy.location().should((loc) => {
            expect(loc.pathname).to.eq('/tournaments');
            expect(loc.search).to.eq('?type=calendar');
        });
    });

    it('has correct content', () => {
        cy.contains('Welcome to the DojoLiga!');
        cy.contains('How to Join');
        cy.contains('Leaderboard Info');
    });

    it('links to Lichess team', () => {
        cy.getBySel('lichess-team-link').should(
            'have.attr',
            'href',
            'https://lichess.org/team/chessdojo'
        );
    });
});
