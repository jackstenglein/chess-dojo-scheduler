import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
    path: [
        path.join(__dirname, '../../../.env.test.local'),
        path.join(__dirname, '../../../.env.local'),
        path.join(__dirname, '../../../.env.test'),
        path.join(__dirname, '../../../.env'),
    ],
});

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
    const username = process.env.AWS_COGNITO_USERNAME ?? '';
    const password = process.env.AWS_COGNITO_PASSWORD ?? '';

    if (!username || !password) {
        throw new Error(
            'Missing AWS_COGNITO_USERNAME or AWS_COGNITO_PASSWORD in .env.test.local',
        );
    }

    console.log(`Authenticating as: ${username}`);

    // Navigate directly to the signin page
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    console.log('On signin page, entering credentials...');

    // Fill in email/username
    const emailInput = page.getByRole('textbox', { name: 'Email' })
    await emailInput.fill(username);

    // Fill in password  
    const passwordInput = page.getByRole('textbox', { name: 'Password' })
    await passwordInput.fill(password);

    // Click sign in button (use data-cy to avoid Google sign-in button)
    const signInButton = page.locator('[data-cy="signin-button"]');
    await signInButton.click();

    // Wait for navigation away from signin page
    await page.waitForURL((url) => !url.pathname.includes('signin'), { timeout: 30000 });

    // Navigate to profile to verify authentication
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile', { timeout: 15000 });

    console.log('Authentication successful, saving storage state');

    // Save storage state (cookies and localStorage)
    await page.context().storageState({ path: authFile });
});
