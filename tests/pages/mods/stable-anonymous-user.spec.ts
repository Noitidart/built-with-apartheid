import { expect, test } from '@playwright/test';

test.describe('Mods Page', () => {
  test.describe('Stable Anonymous User', () => {
    // We want to ensure that anonymous users that have not yet made a mutation
    // do not get a new user id every time they load the page.
    test('should give a first-time visitor a new anonymous user id that persists across loads', async ({
      page
    }) => {
      await page.goto('/mods');

      await page.waitForLoadState('networkidle');

      // Get the authentication cookie that should have been set by SSR
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(
        (cookie) => cookie.name === 'access_token'
      );

      expect(authCookie).toBeDefined();
      expect(authCookie?.value).toBeTruthy();

      // Store the initial token value to compare consistency
      const firstTokenValue = authCookie!.value;
      expect(firstTokenValue).toBeTruthy();

      // Reload the page to test persistence
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Moderator Dashboard' })
      ).toBeVisible();

      // Get cookies again after reload
      const cookiesAfterReload = await page.context().cookies();
      const authCookieAfterReload = cookiesAfterReload.find(
        (cookie) => cookie.name === 'access_token'
      );

      expect(authCookieAfterReload).toBeDefined();
      expect(authCookieAfterReload?.value).toBeTruthy();

      // Token should remain the same across reloads (indicating same user ID)
      expect(authCookieAfterReload!.value).toBe(firstTokenValue);

      // Perform a second reload to triple-check stability
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Moderator Dashboard' })
      ).toBeVisible();

      const cookiesAfterSecondReload = await page.context().cookies();
      const authCookieAfterSecondReload = cookiesAfterSecondReload.find(
        (cookie) => cookie.name === 'access_token'
      );

      expect(authCookieAfterSecondReload).toBeDefined();

      // Token should still be the same, proving anonymous user persistence
      expect(authCookieAfterSecondReload!.value).toBe(firstTokenValue);
    });
  });
});
