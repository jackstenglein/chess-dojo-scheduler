describe('Position Explorer', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );
        cy.visit('/games/1500-1600/2024.07.24_3a1711cf-5adb-44df-b97f-e2a6907f8842');
    });

    it('opens to dojo tab by default', () => {
        cy.getBySel('underboard-button-explorer').click();
        cy.getBySel('explorer-tab-dojo').should('be.visible');
    });

    it('opens other tabs', () => {
        cy.getBySel('underboard-button-explorer').click();

        cy.getBySel('explorer-tab-button-masters').click();
        cy.getBySel('explorer-tab-masters').should('be.visible');

        cy.getBySel('explorer-tab-button-lichess').click();
        cy.getBySel('explorer-tab-lichess').should('be.visible');

        cy.getBySel('explorer-tab-button-tablebase').click();
        cy.getBySel('explorer-tab-tablebase').should('be.visible');
    });

    it('remembers last open tab', () => {
        cy.getBySel('underboard-button-explorer').click();
        cy.getBySel('explorer-tab-dojo').should('be.visible');

        cy.getBySel('explorer-tab-button-masters').click({ force: true });
        cy.getBySel('explorer-tab-masters').should('be.visible');

        cy.getBySel('underboard-button-tags').click();
        cy.getBySel('explorer-tab-masters').should('not.exist');

        cy.getBySel('underboard-button-explorer').click();
        cy.getBySel('explorer-tab-masters').should('be.visible');
    });

    it('shows tablebase warning for more than 7 pieces', () => {
        cy.getBySel('underboard-button-explorer').click();
        cy.getBySel('explorer-tab-button-tablebase').click();

        cy.getBySel('explorer-tab-tablebase').contains(
            'Tablebase is only available for positions with 7 pieces or fewer',
        );
    });
});
