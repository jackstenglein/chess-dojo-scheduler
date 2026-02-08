import { expect, test } from '@playwright/test';

test.describe('Event Editor', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/calendar');
        // Dismiss tutorial dialog if it appears
        const closeButton = page.locator('[role="alertdialog"] button').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
        // Wait for the calendar to load
        await expect(page.getByText('Hide Filters')).toBeVisible();
    });

    test('displays calendar page', async ({ page }) => {
        await expect(page.locator('text=Timezone').first()).toBeVisible();
    });
});
