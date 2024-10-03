describe('Forgot Password Page', () => {
    beforeEach(() => {
        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            codeDeliveryDetails: {
                attributeName: 'email',
                deliveryMedium: 'EMAIL',
                destination: 'jackstenglein+test@gmail.com',
            },
        });
        cy.visit('/forgot-password');
    });

    it('has correct content', () => {
        cy.getBySel('title').should('have.text', 'ChessDojo');
        cy.getBySel('description').should('contain', 'Enter your email');
    });

    it('links back to signin page', () => {
        cy.getBySel('cancel-button').click();

        cy.location('pathname').should('equal', '/signin');
    });

    it('requires email to submit form', () => {
        cy.getBySel('submit-button').click();

        cy.get('#email-helper-text').should('have.text', 'Email is required');
    });

    it('requires an existing account to submit form', () => {
        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            statusCode: 400,
            fixture: 'auth/forgotPassword/nonexistentAccount.json',
        });

        cy.get('#email').type('test@email.com');
        cy.getBySel('submit-button').click();

        cy.get('#email-helper-text').should(
            'have.text',
            'Account with this email does not exist',
        );
    });

    it('requires code to submit second form', () => {
        cy.get('#email').type('jackstenglein+test@gmail.com');
        cy.getBySel('submit-button').click();

        cy.get('#password').type('testpassword');
        cy.get('#password-confirm').type('testpassword');
        cy.getBySel('submit-button').click();

        cy.get('#code-helper-text').should('have.text', 'Recovery code is required');
    });

    it('requires password to be 8 characters', () => {
        cy.get('#email').type('jackstenglein+test@gmail.com');
        cy.getBySel('submit-button').click();

        cy.get('#code').type('12345');
        cy.get('#password').type('1234567');
        cy.getBySel('submit-button').click();

        cy.get('#password-helper-text').should(
            'have.text',
            'Password must be at least 8 characters',
        );
    });

    it('requires password confirm to match', () => {
        cy.get('#email').type('jackstenglein+test@gmail.com');
        cy.getBySel('submit-button').click();

        cy.get('#code').type('12345');
        cy.get('#password').type('12345678');
        cy.get('#password-confirm').type('12345679');
        cy.getBySel('submit-button').click();

        cy.get('#password-confirm-helper-text').should(
            'have.text',
            'Passwords do not match',
        );
    });

    it('fails for incorrect recovery code', () => {
        cy.get('#email').type('jackstenglein+test@gmail.com');
        cy.getBySel('submit-button').click();

        cy.intercept('POST', 'https://cognito-idp.us-east-1.amazonaws.com/', {
            statusCode: 400,
            fixture: 'auth/forgotPassword/incorrectRecoveryCode.json',
        });

        cy.get('#code').type('12345');
        cy.get('#password').type('12345678');
        cy.get('#password-confirm').type('12345678');
        cy.getBySel('submit-button').click();

        cy.get('#code-helper-text').should('have.text', 'Incorrect recovery code.');
    });

    it('redirects back to signin after completion', () => {
        cy.get('#email').type('jackstenglein+test@gmail.com');
        cy.getBySel('submit-button').click();

        cy.get('#code').type('12345');
        cy.get('#password').type('12345678');
        cy.get('#password-confirm').type('12345678');
        cy.getBySel('submit-button').click();

        cy.getBySel('description').should(
            'have.text',
            'You can now sign in using your new password.',
        );
        cy.getBySel('signin-button').click();
        cy.location('pathname').should('equal', '/signin');
    });
});
