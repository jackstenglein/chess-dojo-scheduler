const navbarStartItems = [
    'Newsfeed',
    'Training Plan',
    'Scoreboard',
    'Tournaments',
    'Games',
    'Calendar',
    'Material',
    'Clubs',
    'Blog',
    'Shop',
];

const navbarEndItems = ['Help', 'Notifications', 'navbar-profile-button'];

const viewPortWidths = [
    { width: 1560, hidden: 0, endHidden: 0 },
    { width: 1416, hidden: 2, endHidden: 0 },
    { width: 1315, hidden: 3, endHidden: 0 },
    { width: 1196, hidden: 4, endHidden: 0 },
    { width: 1066, hidden: 5, endHidden: 0 },
    { width: 963, hidden: 6, endHidden: 0 },
    { width: 772, hidden: 7, endHidden: 0 },
    { width: 624, hidden: 8, endHidden: 0 },
    { width: 567, hidden: 8, endHidden: 1 },
    { width: 542, hidden: 8, endHidden: 2 },
    { width: 449, hidden: 10, endHidden: 3 },
];

describe('Navbar', () => {
    it('should have limited options when unauthenticated', () => {
        cy.visit('/');

        cy.getBySel('navbar').contains('Tournaments');
        cy.getBySel('navbar').contains('Material');
        cy.getBySel('navbar').contains('Blog');
        cy.getBySel('navbar').contains('Shop');
        cy.getBySel('navbar').contains('Contact Us');
        cy.getBySel('navbar').contains('Sign In');
        cy.getBySel('navbar').contains('Sign Up');
        cy.getBySel('navbar').get('Profile').should('not.exist');
        cy.getBySel('navbar').get('Sign Out').should('not.exist');

        cy.viewport(449, 660);

        cy.getBySel('navbar-more-button').click();
        cy.get('#menu-appbar').contains('Tournaments');
        cy.get('#menu-appbar').contains('Material');
        cy.get('#menu-appbar').contains('Shop');
        cy.get('#menu-appbar').contains('Sign In');
        cy.get('#menu-appbar').contains('Sign Up');
        cy.get('#menu-appbar').get('Profile').should('not.exist');
    });

    viewPortWidths.forEach(({ width, hidden, endHidden }) => {
        it(`shows correct authenticated items with ${width}px width`, () => {
            cy.viewport(width, 660);
            cy.loginByCognitoApi(
                'navbar',
                Cypress.env('cognito_username'),
                Cypress.env('cognito_password'),
            );

            navbarStartItems
                .slice(0, navbarStartItems.length - hidden)
                .forEach((item) => {
                    cy.getBySel('navbar').contains(item);
                });

            navbarEndItems.slice(endHidden).forEach((item) => cy.getBySel(item));

            if (hidden > 0) {
                cy.getBySel('navbar-more-button').click();

                navbarStartItems
                    .slice(navbarStartItems.length - hidden)
                    .forEach((item) => cy.get('#menu-appbar').contains(item));

                navbarEndItems
                    .slice(0, endHidden)
                    .forEach(
                        (item) =>
                            item !== 'navbar-profile-button' &&
                            cy.get('#menu-appbar').contains(item),
                    );
            }
        });
    });
});
