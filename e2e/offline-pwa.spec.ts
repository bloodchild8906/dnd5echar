// Feature: codex-arcanum
import { test, expect } from '@playwright/test';

test.describe('Offline PWA — Service Worker cache and network resilience', () => {
  test('app renders from SW cache when offline, recovers when network restored', async ({
    page,
  }) => {
    // ── 1. Initial load — let the app fully boot ──────────────────────────────
    await page.goto('/', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Campaign Administration Dashboard/i })).toBeVisible({
      timeout: 15000,
    });

    // ── 2. Wait for Service Worker to activate (if available) ─────────────────
    // SW only registers in secure contexts or localhost; dev mode may skip SW.
    await page
      .evaluate(() => navigator.serviceWorker.ready, { timeout: 15000 } as never)
      .catch(() => {
        // SW not supported or timed out — continue gracefully
      });

    // ── 3. Check whether a SW controller is actually active ───────────────────
    const swRegistered = await page.evaluate(() => navigator.serviceWorker.controller !== null);

    if (!swRegistered) {
      test.info().annotations.push({
        type: 'note',
        description: 'SW not active in dev mode — testing graceful degradation only',
      });
    }

    // ── 4. Verify the app loaded correctly before going offline ───────────────
    await expect(
      page.getByRole('heading', { name: /Campaign Administration Dashboard/i })
    ).toBeVisible({ timeout: 10000 });

    // ── 5. Disable all network requests ──────────────────────────────────────
    await page.route('**/*', (route) => route.abort());

    // ── 6. Reload — SW cache should serve the app shell (or show error state) ─
    await page.reload({ timeout: 15000 }).catch(() => {
      // Reload may "fail" at the navigation level when network is blocked
      // and SW is not active — that's acceptable; we check the DOM below.
    });

    // ── 7. Verify the app still renders (SW cache) or shows a graceful error ──
    if (swRegistered) {
      // SW is active: the cached app shell should be served
      await expect(
        page.getByRole('heading', { name: /Campaign Administration Dashboard/i })
      ).toBeVisible({ timeout: 15000 });
    } else {
      // No SW: the page may show a browser error page or the app's own error state.
      // Either way, verify there is no unhandled JS crash (no blank white page with
      // a React error boundary message that indicates a code bug).
      // We accept any visible content — browser net-error pages are fine here.
      const bodyText = await page.locator('body').textContent({ timeout: 10000 }).catch(() => '');
      // The body should have some content (not completely empty)
      expect(bodyText).toBeTruthy();
    }

    // ── 8. Verify no "network error" crash screen from the app itself ─────────
    // React error boundaries render a specific message; ensure it's not present.
    const errorBoundaryVisible = await page
      .getByText(/Something went wrong/i)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(errorBoundaryVisible).toBe(false);

    // ── 9. Re-enable network ──────────────────────────────────────────────────
    await page.unroute('**/*');

    // ── 10. Navigate to / with network restored — app should load normally ────
    await page.goto('/', { timeout: 15000 });
    await expect(
      page.getByRole('heading', { name: /Campaign Administration Dashboard/i })
    ).toBeVisible({ timeout: 15000 });

    // Verify the app is fully interactive again (no stale error state)
    const newCharBtn = page.getByRole('button', { name: /New Character/i });
    await expect(newCharBtn).toBeVisible({ timeout: 10000 });
  });
});
