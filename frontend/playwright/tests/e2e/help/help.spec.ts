import { expect, test } from '@playwright/test';
import { getBySel } from '../../../lib/helpers';

test.describe('Help Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/help');
    });

    test('renders', async ({ page }) => {
        await expect(page.getByText('Help/FAQs')).toBeVisible();
    });

    test('requires all fields to submit support ticket', async ({ page }) => {
        await getBySel(page, 'support-ticket-submit').click();

        await expect(getBySel(page, 'support-ticket-name')).toContainText('This field is required');
        await expect(getBySel(page, 'support-ticket-email')).toContainText(
            'This field is required',
        );
        await expect(getBySel(page, 'support-ticket-subject')).toContainText(
            'This field is required',
        );
        await expect(getBySel(page, 'support-ticket-message')).toContainText(
            'This field is required',
        );
    });
});
