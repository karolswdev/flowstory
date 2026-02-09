import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // App should load without errors
    await expect(page).toHaveTitle(/User Story/);
  });

  test('displays story title as heading', async ({ page }) => {
    await page.goto('/');
    
    // Should have a story title
    const title = page.getByTestId('story-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Transportation Request');
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known React dev mode warnings
    const realErrors = errors.filter(
      (e) => !e.includes('React DevTools') && !e.includes('Download the React DevTools')
    );

    expect(realErrors).toHaveLength(0);
  });
});
