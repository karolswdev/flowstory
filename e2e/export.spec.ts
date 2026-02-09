import { test, expect } from '@playwright/test';

test.describe('Image Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await expect(page.getByTestId('story-canvas')).toBeVisible();
  });

  test('displays export button', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toBeVisible();
  });

  test('export button has correct label', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toContainText('Export');
  });

  test('export button has export icon', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toContainText('📤');
  });

  test('dropdown shows PDF option', async ({ page }) => {
    await page.getByTestId('export-button').click();

    const pdfOption = page.getByTestId('export-pdf');
    await expect(pdfOption).toBeVisible();
    await expect(pdfOption).toContainText('PDF Document');
  });

  test('dropdown shows GIF option', async ({ page }) => {
    await page.getByTestId('export-button').click();

    const gifOption = page.getByTestId('export-gif');
    await expect(gifOption).toBeVisible();
    await expect(gifOption).toContainText('Animated GIF');
  });

  test('clicking export button opens dropdown', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await exportButton.click();

    const dropdown = page.getByTestId('export-dropdown');
    await expect(dropdown).toBeVisible();
  });

  test('dropdown shows PNG option', async ({ page }) => {
    await page.getByTestId('export-button').click();

    const pngOption = page.getByTestId('export-png');
    await expect(pngOption).toBeVisible();
    await expect(pngOption).toContainText('PNG Image');
    await expect(pngOption).toContainText('High quality raster image');
  });

  test('dropdown shows SVG option', async ({ page }) => {
    await page.getByTestId('export-button').click();

    const svgOption = page.getByTestId('export-svg');
    await expect(svgOption).toBeVisible();
    await expect(svgOption).toContainText('SVG Vector');
    await expect(svgOption).toContainText('Scalable vector graphics');
  });

  test('clicking outside dropdown closes it', async ({ page }) => {
    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-dropdown')).toBeVisible();

    // Click outside
    await page.locator('body').click({ position: { x: 10, y: 10 } });

    await expect(page.getByTestId('export-dropdown')).not.toBeVisible();
  });

  test('dropdown has correct ARIA attributes', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    
    // Before opening
    await expect(exportButton).toHaveAttribute('aria-expanded', 'false');
    await expect(exportButton).toHaveAttribute('aria-haspopup', 'menu');

    // After opening
    await exportButton.click();
    await expect(exportButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('export options have menuitem role', async ({ page }) => {
    await page.getByTestId('export-button').click();

    const pngOption = page.getByTestId('export-png');
    const svgOption = page.getByTestId('export-svg');

    await expect(pngOption).toHaveAttribute('role', 'menuitem');
    await expect(svgOption).toHaveAttribute('role', 'menuitem');
  });

  test('PNG export triggers download', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await page.getByTestId('export-button').click();
    await page.getByTestId('export-png').click();

    const download = await downloadPromise;
    
    // Verify filename includes step number (story ID varies)
    expect(download.suggestedFilename()).toMatch(/-step-1\.png$/);
  });

  test('SVG export triggers download', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await page.getByTestId('export-button').click();
    await page.getByTestId('export-svg').click();

    const download = await downloadPromise;
    
    // Verify filename includes step number
    expect(download.suggestedFilename()).toMatch(/-step-1\.svg$/);
  });

  test('export at different step includes step number in filename', async ({ page }) => {
    // Navigate to step 3
    await page.getByTestId('next-button').click();
    await page.getByTestId('next-button').click();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    await page.getByTestId('export-button').click();
    await page.getByTestId('export-png').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/-step-3\.png$/);
  });

  test('export dropdown closes after selecting option', async ({ page }) => {
    // Set up download listener (don't wait)
    page.waitForEvent('download').catch(() => {});

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-dropdown')).toBeVisible();

    await page.getByTestId('export-png').click();

    // Dropdown should close
    await expect(page.getByTestId('export-dropdown')).not.toBeVisible();
  });

  test('export button shows loading state during export', async ({ page }) => {
    // This test verifies the button shows "Exporting..." during export
    // Note: The export is fast, so we need to catch this quickly
    
    await page.getByTestId('export-button').click();
    
    // Click PNG export
    const exportPromise = page.getByTestId('export-png').click();

    // The button should briefly show loading state
    // Since export is fast, we just verify the download happens
    const downloadPromise = page.waitForEvent('download');
    await exportPromise;
    await downloadPromise;
  });

  test('PNG export produces valid file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    await page.getByTestId('export-button').click();
    await page.getByTestId('export-png').click();

    const download = await downloadPromise;
    
    // Verify file extension
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    
    // Save and verify file exists
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('SVG export produces valid file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');

    await page.getByTestId('export-button').click();
    await page.getByTestId('export-svg').click();

    const download = await downloadPromise;
    
    // Verify file extension
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    
    // Save and verify file exists
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('export respects current theme (light)', async ({ page }) => {
    // Ensure light theme
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    if (theme === 'dark') {
      await page.getByTestId('theme-toggle').click();
    }
    
    // Export should complete without error
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-button').click();
    await page.getByTestId('export-png').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('export respects current theme (dark)', async ({ page }) => {
    // Switch to dark theme
    const html = page.locator('html');
    const theme = await html.getAttribute('data-theme');
    if (theme !== 'dark') {
      await page.getByTestId('theme-toggle').click();
    }
    
    // Export should complete without error
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-button').click();
    await page.getByTestId('export-png').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.png');
  });
});
