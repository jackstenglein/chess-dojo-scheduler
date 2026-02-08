import { expect, test } from '@playwright/test';
import { getBySel } from '../../../../lib/helpers';

test.describe('Training Plan', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/profile?view=progress');
    });

    test('displays task updater', async ({ page }) => {
        await getBySel(page, 'update-task-button').first().click();

        await expect(getBySel(page, 'task-updater-save-button')).toBeVisible();
    });
});
