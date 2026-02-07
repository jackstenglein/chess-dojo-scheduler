import { expect, test } from '@playwright/test';
import { getBySel } from '../../../lib/helpers';

test.describe('Memorize Games Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/material/memorizegames');
        // Wait for PGN selector to load
        await expect(getBySel(page, 'pgn-selector-item').first()).toBeVisible({
            timeout: 15000,
        });
    });

    test('should have game items', async ({ page }) => {
        const count = await getBySel(page, 'pgn-selector-item').count();
        expect(count).toBeGreaterThan(0);
    });

    test('should switch between study/test mode', async ({ page }) => {
        await expect(page.getByText('Show Answer')).not.toBeVisible();

        // Test mode is a radio button, not a regular button
        await page.getByRole('radio', { name: 'Test' }).click();

        await expect(page.getByText('Show Answer')).toBeVisible();
    });

    test('should switch between games', async ({ page }) => {
        // Click different games from the PGN selector
        const items = getBySel(page, 'pgn-selector-item');
        const count = await items.count();
        if (count >= 2) {
            await items.nth(1).click();
            // Verify PGN text is visible (game changed)
            await expect(getBySel(page, 'pgn-text-move-button').first()).toBeVisible();
        }
    });
});
