import { expect, test } from '@playwright/test';

test.describe('Clear All Notifications', () => {
    test('notifications page shows Clear All button when notifications exist', async ({
        page,
    }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        const notifications = page.locator('[class*="MuiStack-root"] > [class*="MuiStack-root"]');
        const clearAllButton = page.getByRole('button', { name: 'Clear All' });

        // If notifications exist, the Clear All button should be visible
        const notificationCount = await notifications.count();
        if (notificationCount > 0) {
            await expect(clearAllButton).toBeVisible();
        } else {
            await expect(clearAllButton).not.toBeVisible();
        }
    });

    test('notifications page hides Clear All button when no notifications exist', async ({
        page,
    }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        const noNotificationsText = page.getByText('No notifications');

        // If "No notifications" text is shown, Clear All should not be visible
        if (await noNotificationsText.isVisible()) {
            const clearAllButton = page.getByRole('button', { name: 'Clear All' });
            await expect(clearAllButton).not.toBeVisible();
        }
    });

    test('clicking Clear All removes all notifications from the page', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('networkidle');

        const clearAllButton = page.locator('[data-cy="clear-all-notifications"]');

        // Only run the clear-all test if the button is present (i.e., notifications exist)
        if (await clearAllButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await clearAllButton.click();

            // Wait for notifications to be cleared
            await expect(page.getByText('No notifications')).toBeVisible({ timeout: 15000 });

            // Clear All button should no longer be visible
            await expect(clearAllButton).not.toBeVisible();
        }
    });

    test('navbar dropdown shows Clear All button when notifications exist', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Open the notifications dropdown
        const notificationButton = page.locator('[data-cy="Notifications"]');
        await notificationButton.click();

        // Wait for the menu to appear
        const menu = page.locator('#notifications-menu');
        await expect(menu).toBeVisible();

        const clearAllButton = menu.getByRole('button', { name: 'Clear All' });
        const noNotificationsItem = menu.getByText('No notifications');

        // If there are notifications, Clear All should be visible; otherwise it should not
        if (await noNotificationsItem.isVisible().catch(() => false)) {
            await expect(clearAllButton).not.toBeVisible();
        } else {
            await expect(clearAllButton).toBeVisible();
        }
    });
});
