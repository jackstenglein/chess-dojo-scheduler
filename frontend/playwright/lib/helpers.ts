import { expect, Locator, Page } from '@playwright/test';

/**
 * Select element by data-cy attribute.
 * Replaces Cypress cy.getBySel('selector')
 */
export function getBySel(page: Page, selector: string): Locator {
    return page.locator(`[data-cy="${selector}"]`);
}

/**
 * Find element within a parent by data-cy attribute.
 * Replaces Cypress cy.findBySel('selector')
 */
export function findBySel(parent: Locator, selector: string): Locator {
    return parent.locator(`[data-cy="${selector}"]`);
}

/**
 * Verify all texts exist on page.
 * Replaces Cypress cy.containsAll(['text1', 'text2'])
 */
export async function containsAll(page: Page, texts: string[]): Promise<void> {
    for (const text of texts) {
        await expect(page.getByText(text, { exact: false })).toBeVisible();
    }
}

/**
 * Verify all texts exist within a locator.
 */
export async function locatorContainsAll(locator: Locator, texts: string[]): Promise<void> {
    for (const text of texts) {
        await expect(locator.getByText(text, { exact: false })).toBeVisible();
    }
}

/**
 * Mock an API endpoint with a fixture or response.
 * Replaces Cypress cy.interceptApi(method, url, response)
 */
export async function interceptApi(
    page: Page,
    method: string,
    urlPath: string,
    response: { fixture?: string; statusCode?: number; body?: unknown },
): Promise<void> {
    // Use glob pattern to match the API URL regardless of base URL.
    // This handles both direct paths and full URLs with the API gateway domain.
    await page.route(`**${urlPath}`, async (route) => {
        if (route.request().method() !== method.toUpperCase()) {
            await route.continue();
            return;
        }

        if (response.fixture) {
            await route.fulfill({
                path: `./tests/fixtures/${response.fixture}`,
                contentType: 'application/json',
            });
        } else {
            await route.fulfill({
                status: response.statusCode ?? 200,
                contentType: 'application/json',
                body: JSON.stringify(response.body ?? {}),
            });
        }
    });
}

/**
 * Wait for navigation to complete after an action.
 * Useful for SPA navigation where URL changes.
 */
export async function waitForNavigation(
    page: Page,
    urlPattern: string | RegExp,
    options?: { timeout?: number },
): Promise<void> {
    await expect(page).toHaveURL(urlPattern, { timeout: options?.timeout ?? 15000 });
}
