import { expect, test } from '@playwright/test';
import { getBySel, interceptApi } from '../../../lib/helpers';

// Match the Cypress test: freeze time at Sept 6, 2023 so the fixture dates fall within range
const fixedDate = new Date(2023, 8, 6); // month is 0-indexed

test.describe('Graduations', () => {
    test('displays correct message when no graduations', async ({ page }) => {
        await page.clock.install({ time: fixedDate });
        await interceptApi(page, 'GET', '/public/graduations', {
            fixture: 'recent/noGraduations.json',
        });
        await page.goto('/recent');
        await expect(page.getByText('No graduations in the selected timeframe')).toBeVisible();
    });

    test('displays graduations table', async ({ page }) => {
        await page.clock.install({ time: fixedDate });
        await interceptApi(page, 'GET', '/public/graduations', {
            fixture: 'recent/graduations.json',
        });
        await page.goto('/recent');

        // Wait for the table to appear
        await expect(getBySel(page, 'recent-graduates-table')).toBeVisible();
    });
});
