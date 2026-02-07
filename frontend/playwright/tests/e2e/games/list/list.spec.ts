import { expect, test } from '@playwright/test';
import { getBySel, findBySel, interceptApi } from '../../../../lib/helpers';

test.describe('List Games Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/games');
        // Wait for the games table to be visible (handles any tutorial popups or redirects)
        await expect(getBySel(page, 'games-table')).toBeVisible({ timeout: 30000 });
    });

    test('has correct columns', async ({ page }) => {
        const table = getBySel(page, 'games-table');
        await expect(table.getByText('Cohort')).toBeVisible();
        await expect(table.getByText('Players')).toBeVisible();
        await expect(table.getByText('Result')).toBeVisible();
        await expect(table.getByText('Played')).toBeVisible();
    });

    test('has import game button', async ({ page }) => {
        const importButton = getBySel(page, 'import-game-button');
        await expect(importButton).toContainText('Analyze a Game');
        await importButton.click();
        await expect(page).toHaveURL(/\/games\/import/, { timeout: 15000 });
    });

    test('has link to full database', async ({ page }) => {
        await expect(
            page.getByText('Download full database (updated daily)'),
        ).toBeVisible();
    });

    test('allows searching by cohort by default', async ({ page }) => {
        const searchForm = getBySel(page, 'search-by-cohort');
        await expect(searchForm).toBeVisible();
        await expect(findBySel(searchForm, 'cohort-select')).toBeVisible();
        await expect(findBySel(searchForm, 'cohort-search-button')).toBeVisible();
    });

    test('allows searching by player', async ({ page }) => {
        await page
            .getByRole('button', { name: 'Search By Player' })
            .click();

        const searchForm = getBySel(page, 'search-by-player');
        await expect(findBySel(searchForm, 'player-name')).toBeVisible();
        await expect(findBySel(searchForm, 'player-search-button')).toBeVisible();
    });

    test('allows searching by eco', async ({ page }) => {
        await page
            .getByRole('button', { name: 'Search By Opening' })
            .click();

        const searchForm = getBySel(page, 'search-by-opening');
        await expect(findBySel(searchForm, 'opening-eco')).toBeVisible();
        await expect(findBySel(searchForm, 'opening-search-button')).toBeVisible();
    });

    test('allows searching current user uploads', async ({ page }) => {
        await page
            .getByRole('button', { name: 'Search My Uploads' })
            .click();

        const searchForm = getBySel(page, 'search-by-owner');
        await expect(findBySel(searchForm, 'owner-search-description')).toBeVisible();
        await expect(findBySel(searchForm, 'owner-search-button')).toBeVisible();
    });

    test('links to game page on row click', async ({ page }) => {
        const table = getBySel(page, 'games-table');
        // Wait for the DataGrid hidden content (measurement area) to be removed
        // before clicking - otherwise the click might hit the hidden duplicate
        await expect(
            table.locator('.MuiDataGrid-main--hiddenContent'),
        ).toHaveCount(0, { timeout: 15000 });
        // Click a visible row in the main (non-hidden) content area
        await table
            .locator('.MuiDataGrid-main:not(.MuiDataGrid-main--hiddenContent) .MuiDataGrid-row')
            .first()
            .click();
        await expect(page).toHaveURL(/\/games\/\d{3,4}-\d{3,4}\/.+$/, {
            timeout: 30000,
        });
    });
});
