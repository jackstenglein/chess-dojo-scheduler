describe('Verify Email Page', () => {
    beforeEach(() => {
        cy.visit('/signup');
        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            CodeDeliveryDetails: {
                AttributeName: 'email',
                DeliveryMedium: 'EMAIL',
                Destination: 'test@email.com',
            },
        });
        cy.get('#name').type('Test Name');
        cy.get('#email').type('test@email.com');
        cy.get('#password').type('testpassword');
        cy.getBySel('submit-button').click();
    });

    it('has correct content', () => {
        cy.getBySel('title').should('have.text', 'ChessDojo');
        cy.getBySel('description').should(
            'contain',
            'please enter the verification code',
        );
    });

    it('requires code to submit', () => {
        cy.getBySel('verify-button').click();

        cy.get('#code-helper-text').should('have.text', 'Verification code is required');
    });

    it('allows sending new code', () => {
        cy.getBySel('resend-button').click();

        cy.contains('New verification code sent');
    });

    it('fails on incorrect code', () => {
        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            statusCode: 400,
            body: {
                __type: 'CodeMismatchException',
                message: 'Invalid verification code provided, please try again.',
            },
        });

        cy.get('#code').type('12345');
        cy.getBySel('verify-button').click();

        cy.get('#code-helper-text').should('contain', 'Invalid verification code');
    });

    it('fails on pre-existing email', () => {
        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            statusCode: 400,
            body: {
                __type: 'AliasExistsException',
                message: 'Alias already exists.',
            },
        });

        cy.get('#code').type('12345');
        cy.getBySel('verify-button').click();

        cy.get('#code-helper-text').should('have.text', 'Alias already exists.');
        cy.contains('An account with this email already exists.');
    });
});
