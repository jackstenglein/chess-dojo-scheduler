import { expect, test } from '@playwright/test';
import { getBySel } from '../../../../lib/helpers';

test.describe('Directories', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/profile?view=games');
        // Wait for the Games tab content to load
        await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    });

    test('displays home directory', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
    });

    test('displays add button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    });

    test('displays new directory dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Add' }).click();
        // Wait for menu to appear
        await page.getByText('New Folder').click();
        await expect(getBySel(page, 'update-directory-form')).toBeVisible();
    });

    test('requires name to create new directory', async ({ page }) => {
        await page.getByRole('button', { name: 'Add' }).click();
        await page.getByText('New Folder').click();
        await expect(getBySel(page, 'update-directory-save-button')).toBeDisabled();

        await getBySel(page, 'update-directory-name').locator('input').fill('Test');
        await expect(getBySel(page, 'update-directory-save-button')).toBeEnabled();
    });

    test('requires name to be <= 100 characters', async ({ page }) => {
        await page.getByRole('button', { name: 'Add' }).click();
        await page.getByText('New Folder').click();
        await expect(getBySel(page, 'update-directory-save-button')).toBeDisabled();

        const input = getBySel(page, 'update-directory-name').locator('input');
        await input.fill('A');
        await expect(getBySel(page, 'update-directory-save-button')).toBeEnabled();

        await input.fill('A'.repeat(101));
        await expect(getBySel(page, 'update-directory-save-button')).toBeDisabled();
        await expect(page.getByText('101 / 100 characters')).toBeVisible();
    });
});
