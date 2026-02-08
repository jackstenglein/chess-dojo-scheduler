import { expect, test } from '@playwright/test';

test.describe('Calendar Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/calendar');
        // Dismiss tutorial dialog if it appears
        const closeButton = page.locator('alertdialog button, [role="alertdialog"] button').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
        // Wait for the calendar filters to load
        await expect(page.getByText('Hide Filters')).toBeVisible();
    });

    test('displays calendar with timezone selector', async ({ page }) => {
        await expect(
            page.locator('text=Timezone').first(),
        ).toBeVisible();
    });

    test('has calendar filter controls', async ({ page }) => {
        await expect(page.getByText('Bookable Meetings')).toBeVisible();
    });
});
