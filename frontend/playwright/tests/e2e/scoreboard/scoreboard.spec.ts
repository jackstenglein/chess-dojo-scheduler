import { expect, test } from '@playwright/test';
import { getBySel, locatorContainsAll } from '../../../lib/helpers';

test.describe('Scoreboard Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/scoreboard');
        // Wait for redirect and scoreboard to fully render
        await page.waitForURL(/\/scoreboard\//);
        // Dismiss any tutorial dialog that may appear
        const closeButton = page.locator('[aria-label="Close"]').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
    });

    test('redirects to cohort-specific scoreboard', async ({ page }) => {
        await expect(page).toHaveURL(/\/scoreboard\/\d+-\d+/);
    });

    test('has selector to change views', async ({ page }) => {
        await expect(getBySel(page, 'scoreboard-view-selector')).toBeVisible();
    });

    test('contains tables for current members and graduates', async ({ page }) => {
        await expect(getBySel(page, 'current-members-scoreboard')).toBeVisible();
        await expect(getBySel(page, 'graduates-scoreboard')).toBeVisible();
    });

    test('contains column groups', async ({ page }) => {
        await page.setViewportSize({ width: 15000, height: 660 });
        // Reload after viewport change to get all columns
        await page.reload();
        await expect(getBySel(page, 'current-members-scoreboard')).toBeVisible();

        const columnGroups = ['User Info', 'Ratings', 'Training Plan', 'Time Spent'];
        await locatorContainsAll(getBySel(page, 'current-members-scoreboard'), columnGroups);
    });

    test('contains default columns', async ({ page }) => {
        await page.setViewportSize({ width: 15000, height: 660 });
        await page.reload();
        await expect(getBySel(page, 'current-members-scoreboard')).toBeVisible();

        const defaultColumns = [
            'Name',
            'Graduated',
            'Rating System',
            'Start Rating',
            'Current Rating',
            'Dojo Score',
        ];
        await locatorContainsAll(getBySel(page, 'current-members-scoreboard'), defaultColumns);
    });
});
