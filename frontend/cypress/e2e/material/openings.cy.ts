const openings = [
    {
        name: 'Starter (1200-1800)',
        courses: [
            {
                name: 'Caro Kann',
                id: '37dd0c09-7622-4e87-b0df-7d3e6b37e410',
            },
            {
                name: 'French Defense',
                id: '0e144cc9-be12-48f2-a3b0-92596fa2559d',
            },
            {
                name: "King's Indian Defense",
                id: '12d020c6-6d03-4b1f-9c01-566bffa3b23b',
            },
            {
                name: 'Najdorf Sicilian',
                id: 'b042a392-e285-4466-9bc0-deeecc2ce16c',
            },
        ],
    },
    {
        name: 'Expert (1800+)',
        courses: [
            {
                name: 'The Aggressive e4 Repertoire',
                id: '2402cb47-d65a-4914-bc11-8f60eb32e41a',
            },
            {
                name: "King's Indian Defense",
                id: 'd30581c8-f2c4-4d1c-8a5e-f303a83cc193',
            },
        ],
    },
];

describe('Openings Tab', () => {
    beforeEach(() => {
        cy.loginByCognitoApi(
            'material',
            Cypress.env('cognito_username'),
            Cypress.env('cognito_password')
        );
        cy.visit('/material');
    });

    it('should have correct sections', () => {
        cy.contains('Starter (1200-1800)');
        cy.contains('Expert (1800+)');
    });

    it('should link to correct pages', () => {
        for (const section of openings) {
            for (const course of section.courses) {
                cy.getBySel(section.name)
                    .contains(course.name)
                    .should('have.attr', 'href', `/courses/OPENING/${course.id}`);
            }
        }
    });
});
