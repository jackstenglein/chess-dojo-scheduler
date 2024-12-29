describe('Share Tab Unauthenticated', () => {
    beforeEach(() => {
        cy.visit('/games/1200-1300/2022.06.28_fb475365-7f5b-4aa6-a69c-a4c8ec16f335');
    });

    it('opens sharing tab when unauthenticated', () => {
        cy.getBySel('underboard-button-share').click();
        cy.getBySel('underboard-tab-share').should('be.visible');
    });
});
