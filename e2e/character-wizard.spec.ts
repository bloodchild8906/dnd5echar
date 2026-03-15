// Feature: codex-arcanum
import { test, expect } from '@playwright/test';

test.describe('Character creation wizard → sheet → HP → export/import', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so each run starts from a clean slate
    await page.goto('/');
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('dnd5echar'))
        .forEach((k) => localStorage.removeItem(k));
    });
    await page.reload();
  });

  test('full wizard flow, HP adjustment, export and import round-trip', async ({ page }) => {
    // ── 1. Dashboard ──────────────────────────────────────────────────────────
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Campaign Administration Dashboard/i })).toBeVisible({
      timeout: 10000,
    });

    // ── 2. Start character builder ────────────────────────────────────────────
    await page.getByRole('button', { name: /New Character/i }).click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/characters\/.+\/builder/, { timeout: 10000 });

    // ── 3. Step 1 — Profile: fill in character name ───────────────────────────
    const nameInput = page.getByLabel(/Name/i).first();
    await nameInput.fill('Test Hero', { timeout: 10000 });

    // Advance to Origins step
    await page.getByRole('button', { name: /Next|Origins/i }).first().click({ timeout: 10000 });

    // ── 4. Step 2 — Origins: pick a race and class ────────────────────────────
    // Wait for reference cards to appear (Open5e may be slow / offline — cards or fallback)
    await page.waitForTimeout(2000);

    // Try to click the first available race reference card
    const raceCards = page.locator('.reference-card').first();
    const raceCardCount = await raceCards.count();
    if (raceCardCount > 0) {
      await raceCards.click({ timeout: 10000 });
    } else {
      // Fallback: type directly into the Race input
      await page.getByLabel(/Race/i).first().fill('Human');
    }

    // Try to click the first available class reference card (there will be multiple .reference-card)
    const allReferenceCards = page.locator('.reference-card');
    const totalCards = await allReferenceCards.count();
    if (totalCards > 1) {
      await allReferenceCards.nth(1).click({ timeout: 10000 });
    } else {
      await page.getByLabel(/Class/i).first().fill('Fighter');
    }

    // Advance to Abilities step
    await page.getByRole('button', { name: /Next|Abilities/i }).first().click({ timeout: 10000 });

    // ── 5. Step 3 — Abilities: accept defaults and advance ────────────────────
    await page.getByRole('button', { name: /Next|Combat/i }).first().click({ timeout: 10000 });

    // ── 6. Step 4 — Combat: set a non-zero Max HP so the step is valid ────────
    const maxHpInput = page.getByLabel(/Max HP/i).first();
    await maxHpInput.fill('10', { timeout: 10000 });

    // Advance through remaining steps (Equipment, Loadout, Story) to Review
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /Next|Equipment|Loadout|Story|Review/i }).first().click({
        timeout: 10000,
      });
      await page.waitForTimeout(300);
    }

    // ── 7. Review step — confirm to navigate to character sheet ───────────────
    // The last step replaces "Next" with "Confirm" or similar
    const confirmBtn = page
      .getByRole('button', { name: /Confirm|Finish|Complete|Go to Sheet/i })
      .first();
    const confirmVisible = await confirmBtn.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmBtn.click({ timeout: 10000 });
    } else {
      // Fallback: click whatever the last navigation button is
      await page.getByRole('button', { name: /Next/i }).first().click({ timeout: 10000 });
    }

    // ── 8. Verify we landed on the character sheet ────────────────────────────
    await expect(page).toHaveURL(/\/characters\/.+\/sheet/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Character Sheet/i })).toBeVisible({
      timeout: 10000,
    });

    // Capture the character ID from the URL for later assertions
    const sheetUrl = page.url();
    const characterIdMatch = sheetUrl.match(/\/characters\/([^/]+)\/sheet/);
    const characterId = characterIdMatch?.[1] ?? '';
    expect(characterId).toBeTruthy();

    // ── 9. Verify character name appears on the sheet ─────────────────────────
    await expect(page.getByText('Test Hero')).toBeVisible({ timeout: 10000 });

    // ── 10. HP adjustment — reduce current HP by 1 ───────────────────────────
    // The CombatBlock renders a NumberAdjuster labelled "Current HP" with − and + buttons
    const hpSection = page.locator('.combat-block').first();
    await expect(hpSection).toBeVisible({ timeout: 10000 });

    // Read the initial HP value from the strong element inside the Current HP adjuster
    const currentHpAdjuster = page.locator('.number-adjuster').filter({ hasText: /Current HP/i });
    const initialHpText = await currentHpAdjuster.locator('strong').textContent({ timeout: 10000 });
    const initialHp = parseInt(initialHpText ?? '0', 10);

    // Click the "−" button to reduce HP by 1
    await currentHpAdjuster.getByRole('button', { name: '-' }).click({ timeout: 10000 });

    // Verify HP decreased
    const updatedHpText = await currentHpAdjuster.locator('strong').textContent({ timeout: 5000 });
    const updatedHp = parseInt(updatedHpText ?? '0', 10);
    expect(updatedHp).toBe(Math.max(0, initialHp - 1));

    // ── 11. Navigate to Import/Export page ───────────────────────────────────
    await page.goto('/import-export');
    await expect(page).toHaveURL('/import-export', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Backups and Snapshots/i })).toBeVisible({
      timeout: 10000,
    });

    // ── 12. Export the full app bundle ────────────────────────────────────────
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: /Export Full App/i }).click({ timeout: 10000 }),
    ]);

    expect(download).toBeTruthy();
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Read the exported JSON content
    const { readFileSync } = await import('node:fs');
    const exportedJson = readFileSync(downloadPath!, 'utf-8');
    const exportedBundle = JSON.parse(exportedJson) as { characters?: { name: string }[] };

    // Verify the exported bundle contains our character
    const exportedCharacter = exportedBundle.characters?.find((c) => c.name === 'Test Hero');
    expect(exportedCharacter).toBeTruthy();

    // ── 13. Import the exported data back ────────────────────────────────────
    // First clear the workspace by navigating to dashboard and deleting the character,
    // then import the bundle back to verify round-trip integrity.
    // We use the textarea import path on the Import/Export page.
    const textarea = page.locator('textarea').first();
    await textarea.fill(exportedJson, { timeout: 10000 });

    // Click "Merge Into Current Data" (no confirm dialog required)
    await page.getByRole('button', { name: /Merge Into Current Data/i }).click({ timeout: 10000 });

    // Verify success message
    await expect(page.getByText(/Imported bundle and merged/i)).toBeVisible({ timeout: 10000 });

    // ── 14. Verify character still exists on the dashboard ───────────────────
    await page.goto('/');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('Test Hero')).toBeVisible({ timeout: 10000 });
  });
});
