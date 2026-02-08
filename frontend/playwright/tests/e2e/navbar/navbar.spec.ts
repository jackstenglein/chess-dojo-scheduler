import { expect, test } from '@playwright/test';
import { getBySel } from '../../../lib/helpers';

const navbarStartItems = [
    'Newsfeed',
    'Training Plan',
    'Scoreboard',
    'Tournaments',
    'Games',
    'Calendar',
    'Material',
    'Live Classes',
    'Clubs',
    'Blog',
    'Shop',
];

const navbarEndItems = ['Help', 'Notifications', 'navbar-profile-button'];

const viewPortWidths = [
    { width: 1856, hidden: 0, endHidden: 0 },
    { width: 1694, hidden: 2, endHidden: 0 },
    { width: 1599, hidden: 3, endHidden: 0 },
    { width: 1388, hidden: 4, endHidden: 0 },
    { width: 1249, hidden: 5, endHidden: 0 },
    { width: 1116, hidden: 6, endHidden: 0 },
    { width: 990, hidden: 7, endHidden: 0 },
    { width: 797, hidden: 8, endHidden: 0 },
    { width: 790, hidden: 9, endHidden: 0 },
    { width: 567, hidden: 9, endHidden: 1 },
    { width: 542, hidden: 9, endHidden: 2 },
    { width: 449, hidden: 11, endHidden: 3 },
];

test.describe('Navbar (unauthenticated)', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should have limited options when unauthenticated', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 660 });
        await page.goto('/');

        const navbar = getBySel(page, 'navbar');
        await expect(navbar.getByText('Live Classes')).toBeVisible();
        await expect(navbar.getByText('Tournaments')).toBeVisible();
        await expect(navbar.getByText('Blog')).toBeVisible();
        await expect(navbar.getByText('Shop')).toBeVisible();
        await expect(navbar.getByText('Sign In')).toBeVisible();
        await expect(navbar.getByText('Sign Up')).toBeVisible();
        await expect(navbar.getByText('Profile')).not.toBeVisible();
        await expect(navbar.getByText('Sign Out')).not.toBeVisible();

        // Test mobile menu
        await page.setViewportSize({ width: 449, height: 660 });
        await getBySel(page, 'navbar-more-button').click();

        const menu = page.locator('#menu-appbar');
        await expect(menu.getByRole('menuitem', { name: /Live Classes/ })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Tournaments' })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Blog' })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Shop' })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Sign In' })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Sign Up' })).toBeVisible();
        await expect(menu.getByRole('menuitem', { name: 'Profile' })).not.toBeVisible();
    });
});

test.describe('Navbar (authenticated)', () => {
    for (const { width, hidden, endHidden } of viewPortWidths) {
        test(`shows correct authenticated items with ${width}px width`, async ({ page }) => {
            await page.setViewportSize({ width, height: 660 });
            await page.goto('/profile');

            const navbar = getBySel(page, 'navbar');

            // Check visible start items
            const visibleStartItems = navbarStartItems.slice(0, navbarStartItems.length - hidden);
            for (const item of visibleStartItems) {
                await expect(navbar.getByText(item, { exact: false })).toBeVisible();
            }

            // Check visible end items
            const visibleEndItems = navbarEndItems.slice(endHidden);
            for (const item of visibleEndItems) {
                if (item === 'navbar-profile-button') {
                    await expect(getBySel(page, item)).toBeVisible();
                } else {
                    await expect(getBySel(page, item)).toBeVisible();
                }
            }

            // Check hidden items in menu
            if (hidden > 0) {
                await getBySel(page, 'navbar-more-button').click();
                const menu = page.locator('#menu-appbar');

                const hiddenStartItems = navbarStartItems.slice(navbarStartItems.length - hidden);
                for (const item of hiddenStartItems) {
                    // Use regex for "Live Classes" to handle "Live Classes NEW"
                    const name = item === 'Live Classes' ? /Live Classes/ : item;
                    await expect(menu.getByRole('menuitem', { name })).toBeVisible();
                }

                const hiddenEndItems = navbarEndItems.slice(0, endHidden);
                for (const item of hiddenEndItems) {
                    if (item !== 'navbar-profile-button') {
                        await expect(menu.getByRole('menuitem', { name: item })).toBeVisible();
                    }
                }
            }
        });
    }
});
