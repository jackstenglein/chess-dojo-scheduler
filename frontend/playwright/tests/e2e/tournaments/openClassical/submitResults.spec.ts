import { expect, test } from '@playwright/test';
import { getBySel, interceptApi } from '../../../../lib/helpers';

test.describe('Submit Results Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/tournaments/open-classical/submit-results');
        // Wait for form to load
        await expect(getBySel(page, 'submit-button')).toBeVisible({ timeout: 15000 });
    });

    test('requires region to submit', async ({ page }) => {
        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();

        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'white').locator('input').fill('shatterednirvana');
        await getBySel(page, 'black').locator('input').fill('jackstenglein');

        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'region')).toContainText('This field is required');
    });

    test('requires section to submit', async ({ page }) => {
        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();

        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'white').locator('input').fill('shatterednirvana');
        await getBySel(page, 'black').locator('input').fill('jackstenglein');

        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'section')).toContainText('This field is required');
    });

    test('requires game url to submit', async ({ page }) => {
        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();

        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();

        await getBySel(page, 'white').locator('input').fill('shatterednirvana');
        await getBySel(page, 'black').locator('input').fill('jackstenglein');

        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'game-url')).toContainText('This field is required');
    });

    test('requires white to submit', async ({ page }) => {
        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();

        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();

        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'black').locator('input').fill('jackstenglein');

        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'white')).toContainText('This field is required');
    });

    test('requires black to submit', async ({ page }) => {
        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();

        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();

        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'white').locator('input').fill('jackstenglein');

        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'black')).toContainText('This field is required');
    });

    test('requires result to submit', async ({ page }) => {
        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();

        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();

        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'white').locator('input').fill('jackstenglein');
        await getBySel(page, 'black').locator('input').fill('jackstenglein');

        await getBySel(page, 'submit-button').click();

        await expect(getBySel(page, 'result')).toContainText('This field is required');
    });

    test('redirects to details page on submit', async ({ page }) => {
        await interceptApi(page, 'POST', '/tournaments/open-classical/results', {
            body: {
                sections: {
                    A_U1900: {
                        rounds: [],
                    },
                },
            },
        });

        await getBySel(page, 'region').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Region A/ }).click();
        await getBySel(page, 'section').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: 'U1900' }).click();
        await getBySel(page, 'game-url').locator('input').fill('https://test.com');
        await getBySel(page, 'white').locator('input').fill('cypress');
        await getBySel(page, 'black').locator('input').fill('cypress');
        await getBySel(page, 'result').locator('[role="combobox"]').click();
        await page.getByRole('option', { name: /Black Wins/ }).click();
        await getBySel(page, 'submit-button').click();

        await expect(page).toHaveURL(/\/tournaments\/open-classical/, {
            timeout: 15000,
        });
    });
});
