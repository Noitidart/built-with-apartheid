import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const TEST_CREDENTIALS = {
  ADMIN_EMAIL: 'admin@example.com',
  ADMIN_PASSWORD: 'pppppp',
  NON_MOD_EMAIL: 'user@example.com',
  NON_MOD_PASSWORD: 'pppppp'
} as const;

test.describe('Mods Page', () => {
  test.describe.serial('Happy Path', () => {
    let sharedContext: BrowserContext;
    let sharedPage: Page;

    // Use shared browser context to maintain authentication state (cookies)
    // between test steps. Without this, each test would get its own isolated
    // context and cookies wouldn't persist as Playwright gives each context a
    // fresh browser instance, so no cookies are present.
    test.beforeAll(async ({ browser }) => {
      // We don't need to clear cookies as each Playwright context is isolated
      // from the others so starts with no cookies.
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
    });

    test.afterAll(async () => {
      await sharedPage.close();
      await sharedContext.close();
    });
    test('should display login form when no authentication cookies are present', async () => {
      // Clear any existing authentication cookies
      await sharedContext.clearCookies();
      await sharedPage.goto('/mods');

      // Should see the page title
      await expect(
        sharedPage.getByRole('heading', { name: 'Moderator Dashboard' })
      ).toBeVisible();

      // Should display login form when not authenticated
      await expect(sharedPage.getByPlaceholder('Email address')).toBeVisible();
      await expect(sharedPage.getByPlaceholder('Password')).toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Sign in' })
      ).toBeVisible();
    });

    test('should successfully authenticate mod and display dashboard', async () => {
      await sharedPage.goto('/mods');

      // Fill in login credentials for moderator user
      const emailInput = sharedPage.getByPlaceholder('Email address');
      const passwordInput = sharedPage.getByPlaceholder('Password');
      const loginButton = sharedPage.getByRole('button', { name: 'Sign in' });

      await emailInput.fill(TEST_CREDENTIALS.ADMIN_EMAIL);
      await passwordInput.fill(TEST_CREDENTIALS.ADMIN_PASSWORD);

      // Submit login form
      await loginButton.click();
      await sharedPage.waitForLoadState('networkidle');

      // Should display authenticated moderator dashboard
      await expect(
        sharedPage.getByText(
          `Welcome ${TEST_CREDENTIALS.ADMIN_EMAIL} to the moderator dashboard`
        )
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Logout' })
      ).toBeVisible();

      // Should hide login form after successful authentication
      await expect(
        sharedPage.getByPlaceholder('Email address')
      ).not.toBeVisible();
      await expect(sharedPage.getByPlaceholder('Password')).not.toBeVisible();
    });

    test('should persist authentication state after page refresh', async () => {
      await sharedPage.goto('/mods');

      // Refresh the page to test authentication persistence
      await sharedPage.reload();

      // Should remain authenticated after page refresh
      await expect(
        sharedPage.getByText(
          `Welcome ${TEST_CREDENTIALS.ADMIN_EMAIL} to the moderator dashboard`
        )
      ).toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Logout' })
      ).toBeVisible();

      // Should not show login form when authenticated
      await expect(
        sharedPage.getByPlaceholder('Email address')
      ).not.toBeVisible();
      await expect(sharedPage.getByPlaceholder('Password')).not.toBeVisible();
    });

    test('should successfully logout and clear authentication state', async () => {
      await sharedPage.goto('/mods');

      // Click logout button
      await sharedPage.getByRole('button', { name: 'Logout' }).click();
      await sharedPage.waitForLoadState('networkidle');

      // Should display login form after logout
      await expect(sharedPage.getByPlaceholder('Email address')).toBeVisible();
      await expect(sharedPage.getByPlaceholder('Password')).toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Sign in' })
      ).toBeVisible();

      // Should hide authenticated content after logout
      await expect(
        sharedPage.getByText(
          `Welcome ${TEST_CREDENTIALS.ADMIN_EMAIL} to the moderator dashboard`
        )
      ).not.toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Logout' })
      ).not.toBeVisible();
    });

    test('should persist logged out state after page refresh', async () => {
      await sharedPage.goto('/mods');

      // Refresh the page to test logout persistence
      await sharedPage.reload();

      // Should remain logged out after page refresh
      await expect(sharedPage.getByPlaceholder('Email address')).toBeVisible();
      await expect(sharedPage.getByPlaceholder('Password')).toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Sign in' })
      ).toBeVisible();

      // Should not show authenticated content when logged out
      await expect(
        sharedPage.getByText(
          `Welcome ${TEST_CREDENTIALS.ADMIN_EMAIL} to the moderator dashboard`
        )
      ).not.toBeVisible();
      await expect(
        sharedPage.getByRole('button', { name: 'Logout' })
      ).not.toBeVisible();
    });
  });
});
