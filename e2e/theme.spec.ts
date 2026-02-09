import { test, expect } from '@playwright/test';

test.describe('Theming', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('[data-testid="story-panel"]');
  });

  test('displays theme toggle button', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toBeVisible();
  });

  test('shows theme label', async ({ page }) => {
    const label = page.getByTestId('theme-label');
    await expect(label).toBeVisible();
    // Default is light, so label shows "Dark" (the action to switch to)
    await expect(label).toContainText('Dark');
  });

  test('defaults to light theme', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    await expect(toggle).toHaveAttribute('data-theme', 'light');

    // Check document has light theme attribute
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
  });

  test('toggle switches to dark theme', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    
    // Initially light
    await expect(toggle).toHaveAttribute('data-theme', 'light');

    // Click to toggle
    await toggle.click();

    // Now dark
    await expect(toggle).toHaveAttribute('data-theme', 'dark');
    
    // Document should have dark theme
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
  });

  test('toggle switches back to light theme', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    
    // Toggle to dark
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-theme', 'dark');

    // Toggle back to light
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-theme', 'light');
  });

  test('theme label updates on toggle', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    const label = page.getByTestId('theme-label');

    // Initially shows "Dark" (option to switch to)
    await expect(label).toContainText('Dark');

    // Toggle
    await toggle.click();

    // Now shows "Light"
    await expect(label).toContainText('Light');
  });

  test('theme icon updates on toggle', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');

    // Light theme shows moon icon (to switch to dark)
    await expect(toggle).toContainText('🌙');

    // Toggle to dark
    await toggle.click();

    // Dark theme shows sun icon (to switch to light)
    await expect(toggle).toContainText('☀️');
  });

  test('CSS variables are set for light theme', async ({ page }) => {
    // Check a primary CSS variable
    const primary = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
    );
    expect(primary).toBe('#2196F3');

    const bgPrimary = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim()
    );
    expect(bgPrimary).toBe('#ffffff');
  });

  test('CSS variables change for dark theme', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    await toggle.click();

    // Check dark theme CSS variables
    const primary = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
    );
    expect(primary).toBe('#64B5F6');

    const bgPrimary = await page.evaluate(() => 
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim()
    );
    expect(bgPrimary).toBe('#121212');
  });

  test('theme persists after page reload', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle');
    
    // Switch to dark
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-theme', 'dark');

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="theme-toggle"]');

    // Should still be dark
    const newToggle = page.getByTestId('theme-toggle');
    await expect(newToggle).toHaveAttribute('data-theme', 'dark');
  });

  test('story panel respects theme', async ({ page }) => {
    const panel = page.getByTestId('story-panel');
    
    // Toggle to dark
    await page.getByTestId('theme-toggle').click();
    
    // Panel should still be visible and functional
    await expect(panel).toBeVisible();
    
    // Narrative should be readable
    const narrative = page.getByTestId('narrative-text');
    await expect(narrative).toBeVisible();
  });

  test('playback controls respect theme', async ({ page }) => {
    const controls = page.getByTestId('playback-controls');
    
    // Toggle to dark
    await page.getByTestId('theme-toggle').click();
    
    // Controls should still work
    await expect(controls).toBeVisible();
    
    // Buttons should be functional
    const nextButton = page.getByTestId('next-button');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    
    // Verify navigation still works
    const counter = page.getByTestId('step-counter');
    await expect(counter).toContainText('2 / 9');
  });
});
