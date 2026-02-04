const navbarStartItems = [
    'Training Plan',
    'Games',
    'Calendar',
    'Tournaments',
    'Live Classes',
    'Learn',
    'Social',
    'Shop',
];

const navbarEndItems = ['Help', 'Search Users', 'Timer', 'Notifications', 'navbar-profile-button'];

const viewPortWidths = [
    { width: 1501, hidden: 0, endHidden: 0 },
    { width: 1499, hidden: 2, endHidden: 0 },
    { width: 1340, hidden: 3, endHidden: 0 },
    { width: 1216, hidden: 4, endHidden: 0 },
    { width: 999, hidden: 5, endHidden: 0 },
    { width: 809, hidden: 6, endHidden: 0 },
    { width: 679, hidden: 6, endHidden: 1 },
    { width: 639, hidden: 6, endHidden: 2 },
    { width: 583, hidden: 6, endHidden: 3 },
    { width: 566, hidden: 6, endHidden: 4 },
    { width: 541, hidden: 6, endHidden: 5 },
    { width: 449, hidden: 8, endHidden: 5 },
];

describe('Navbar', () => {
    it('should have limited options when unauthenticated', () => {
        cy.visit('/');
        cy.viewport(1200, 660);

        cy.getBySel('navbar').contains('Live Classes');
        cy.getBySel('navbar').contains('Tournaments');
        cy.getBySel('navbar').contains('Blog');
        cy.getBySel('navbar').contains('Shop');
        cy.getBySel('navbar').contains('Sign In');
        cy.getBySel('navbar').contains('Sign Up');
        cy.getBySel('navbar').get('Profile').should('not.exist');
        cy.getBySel('navbar').get('Sign Out').should('not.exist');

        cy.viewport(449, 660);

        cy.getBySel('navbar-more-button').click();
        cy.get('#menu-appbar').contains('Live Classes');
        cy.get('#menu-appbar').contains('Tournaments');
        cy.get('#menu-appbar').contains('Blog');
        cy.get('#menu-appbar').contains('Shop');
        cy.get('#menu-appbar').contains('Sign In');
        cy.get('#menu-appbar').contains('Sign Up');
        cy.get('#menu-appbar').get('Profile').should('not.exist');
    });

    viewPortWidths.forEach(({ width, hidden, endHidden }) => {
        it(`shows correct authenticated items with ${width}px width`, () => {
            cy.viewport(width, 660);
            cy.loginByCognitoApi(
                'test',
                cy.dojo.env('cognito_username'),
                cy.dojo.env('cognito_password'),
            );
            cy.visit('/profile');

            navbarStartItems.slice(0, navbarStartItems.length - hidden).forEach((item) => {
                cy.getBySel('navbar').contains(item);
            });

            navbarEndItems.slice(endHidden).forEach((item) => {
                cy.getBySel(item);
            });

            if (hidden > 0) {
                cy.getBySel('navbar-more-button').click();

                navbarStartItems.slice(navbarStartItems.length - hidden).forEach((item) => {
                    cy.get('#menu-appbar').contains(item);
                });

                navbarEndItems.slice(0, endHidden).forEach((item) => {
                    if (item !== 'navbar-profile-button') {
                        cy.get('#menu-appbar').contains(item);
                    }
                });
            }
        });
    });
});
