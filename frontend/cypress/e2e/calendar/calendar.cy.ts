/**
 * Returns the most recent Sunday before the given date.
 * @param d The date to get the Sunday for.
 * @returns The most recent Sunday before the given date.
 */
function getSunday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

/**
 * Returns a new date created by adding the given number of days to d.
 * @param d The date to add days to.
 * @param count The number of days to add.
 * @returns A new date with the number of days added to d.
 */
function addDays(d: Date, count: number): Date {
    const result = new Date(d);
    result.setDate(d.getDate() + count);
    return result;
}

const sunday = getSunday(new Date());

const dateMapper: Record<string, string> = {
    '2023-09-10': sunday.toISOString().slice(0, 10),
    '2023-09-11': addDays(sunday, 1).toISOString().slice(0, 10),
    '2023-09-12': addDays(sunday, 2).toISOString().slice(0, 10),
    '2023-09-13': addDays(sunday, 3).toISOString().slice(0, 10),
    '2023-09-14': addDays(sunday, 4).toISOString().slice(0, 10),
    '2023-09-15': addDays(sunday, 5).toISOString().slice(0, 10),
    '2023-09-16': addDays(sunday, 6).toISOString().slice(0, 10),
};

interface Event {
    startTime: string;
    endTime: string;
}

describe('Calendar Page', () => {
    beforeEach(() => {
        cy.fixture('calendar/events.json').then(({ events }: { events: Event[] }) => {
            for (const event of events) {
                const startDate = event.startTime.slice(0, 10);
                const endDate = event.endTime.slice(0, 10);

                event.startTime = event.startTime.replace(
                    startDate,
                    dateMapper[startDate],
                );
                event.endTime = event.endTime.replace(endDate, dateMapper[endDate]);
            }

            cy.interceptApi('GET', '/calendar', { events });
        });

        cy.loginByCognitoApi(
            'test',
            cy.dojo.env('cognito_username'),
            cy.dojo.env('cognito_password'),
        );

        cy.visit('/calendar');
    });

    it('has correct filters', () => {
        cy.getBySel('calendar-filters').contains('Timezone');
        cy.getBySel('calendar-filters').getBySel('timezone-selector');

        cy.getBySel('calendar-filters').contains('My Dojo Calendar');
        cy.getBySel('calendar-filters').contains('DojoLiga Tournaments');
        cy.getBySel('calendar-filters').contains('Bookable Meetings');
        cy.getBySel('calendar-filters').contains('Cohorts');
    });

    it('prevents free users from adding events', () => {
        cy.interceptApi('GET', '/user', { fixture: 'auth/freeUser.json' });
        cy.interceptApi('GET', '/user/access', { statusCode: 403 });
        cy.visit('/calendar');

        cy.getBySel('upsell-alert')
            .contains('View Prices')
            .should(
                'have.attr',
                'href',
                '/prices?redirect=http%3A%2F%2Flocalhost%3A3000%2Fcalendar',
            );

        cy.get('.rs__cell.rs__header.rs__time').first().siblings().first().click();

        cy.getBySel('upsell-dialog')
            .contains('View Prices')
            .should('have.attr', 'href', '/prices');
    });

    it('displays correct events for tournament filters', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('dojoliga-tournaments').click();
        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 12);

        cy.get('.MuiPopover-root').contains('Rapid').click();
        cy.get('.MuiPopover-root').contains('Classical').click();
        cy.get('.rs__event__item').should('have.length', 3);
    });

    it('displays correct events for dojo events filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('my-dojo-calendar').click();
        cy.get('.MuiPopover-root').contains('Availabilities').click();
        cy.get('.MuiPopover-root').contains('Meetings').click();
        cy.get('.MuiPopover-root').contains('Coaching Sessions').click();
        cy.get('.rs__event__item').should('have.length', 25);
    });

    it('displays correct events for meeting types filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('calendar-filters').contains('All Types').click();
        cy.get('.MuiPopover-root').contains('All Types').click();
        cy.get('.rs__event__item').should('have.length', 24);

        cy.get('.MuiPopover-root').contains('Classical Game').click();
        cy.get('.rs__event__item').should('have.length', 26);
    });

    it('displays correct events for cohort filter', () => {
        cy.get('.rs__event__item').should('have.length', 26);

        cy.getBySel('calendar-filters').contains('All Cohorts').click();
        cy.get('.MuiPopover-root').contains('All Cohorts').click();
        cy.get('.rs__event__item').should('have.length', 24);

        cy.get('.MuiPopover-root').contains('1500-1600').click();
        cy.get('.rs__event__item').should('have.length', 26);
    });

    it('displays correct content for availability', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });

        cy.getBySel('availability-viewer').contains('Owner');
        cy.getBySel('availability-viewer')
            .contains('Ricardo Alves (1500-1600)')
            .should('have.attr', 'href', '/profile/c6f63283-044e-49db-b1ba-5b23556a0349');
        cy.getBySel('graduation-icon');

        cy.getBySel('availability-viewer').contains('Available Types');
        cy.getBySel('availability-viewer').contains('Classical Game');

        cy.getBySel('availability-viewer').contains('Description');
        cy.getBySel('availability-viewer').contains('Classical Game + Postmortem');

        cy.getBySel('availability-viewer').contains('Cohorts');
        cy.getBySel('availability-viewer').contains('1400-1500, 1500-1600, 1600-1700');

        cy.getBySel('book-button').contains('Book');
    });

    it('shows availability booker', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });
        cy.getBySel('book-button').click();

        cy.contains('Book Meeting');
        cy.getBySel('cancel-button');
        cy.getBySel('book-button');

        cy.contains('Available Start Times');
        const date = new Date(dateMapper['2023-09-13']);
        cy.contains(`${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`);

        cy.contains('Owner');
        cy.contains('Ricardo Alves (1500-1600)').should(
            'have.attr',
            'href',
            '/profile/c6f63283-044e-49db-b1ba-5b23556a0349',
        );
        cy.getBySel('graduation-icon');

        cy.contains('Location');
        cy.contains('Discord');

        cy.contains('Meeting Type');
        cy.contains('Classical Game');
        cy.getBySel('meeting-type-radio');

        cy.contains('Start Time');
        cy.contains('Must be between');
    });

    it('cancels availability booker', () => {
        cy.contains('Bookable - Ricardo Alves').click({ force: true });
        cy.getBySel('book-button').click();

        cy.getBySel('cancel-button').click();
        cy.getBySel('availability-booker').should('not.exist');
    });
});
