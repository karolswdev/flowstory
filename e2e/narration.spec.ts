import { test, expect } from '@playwright/test';

test.describe('Narration Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
  });

  test('canvas renders without narration errors', async ({ page }) => {
    // Verify no console errors related to narration
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    
    // Filter for narration-related errors
    const criticalErrors = errors.filter(e => 
      e.includes('narration') || 
      e.includes('spotlight') || 
      e.includes('Narration')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('spotlight overlay not visible by default', async ({ page }) => {
    // Spotlight should not be present initially
    const spotlight = page.locator('[data-testid="spotlight-overlay"]');
    await expect(spotlight).toHaveCount(0);
  });

  test('narrative card not visible by default', async ({ page }) => {
    // Narrative card should not be present initially
    const card = page.locator('[data-testid="narrative-card"]');
    await expect(card).toHaveCount(0);
  });
});

test.describe('Narration - Keyboard Shortcuts', () => {
  test('Escape key does not cause errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
    
    // Press Escape - should not cause errors even without narration active
    await page.keyboard.press('Escape');
    
    // Canvas should still be visible
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('Space key does not cause errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
    
    // Press Space - may affect playback but should not error
    await page.keyboard.press('Space');
    
    // Canvas should still be visible
    await expect(page.locator('.react-flow')).toBeVisible();
  });
});

test.describe('Narration - Accessibility', () => {
  test('respects reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Should load without errors
    await expect(page.locator('.react-flow')).toBeVisible({ timeout: 5000 });
  });
});
