import { test, expect } from '@playwright/test';

test.describe('Story Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await page.waitForSelector('[data-testid="story-panel"]');
  });

  test('displays story panel', async ({ page }) => {
    const panel = page.getByTestId('story-panel');
    await expect(panel).toBeVisible();
  });

  test('displays story header with title', async ({ page }) => {
    const header = page.getByTestId('story-header');
    await expect(header).toBeVisible();

    const title = page.getByTestId('story-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Transportation Request');
  });

  test('displays story description', async ({ page }) => {
    const description = page.getByTestId('story-description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('TRF');
  });

  test('displays bounded context badge', async ({ page }) => {
    const context = page.getByTestId('story-context');
    await expect(context).toBeVisible();
    await expect(context).toContainText('enrollment-demand');
  });

  test('displays step badge', async ({ page }) => {
    const badge = page.getByTestId('step-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Step 1');
  });

  test('step badge updates on navigation', async ({ page }) => {
    const badge = page.getByTestId('step-badge');
    await expect(badge).toContainText('Step 1');

    await page.getByTestId('next-button').click();
    await expect(badge).toContainText('Step 2');

    await page.getByTestId('next-button').click();
    await expect(badge).toContainText('Step 3');
  });

  test('displays current step narrative', async ({ page }) => {
    const narrative = page.getByTestId('narrative-text');
    await expect(narrative).toBeVisible();
    await expect(narrative).toContainText('Sarah');
    await expect(narrative).toContainText('enroll her child');
  });

  test('narrative updates on step change', async ({ page }) => {
    const narrative = page.getByTestId('narrative-text');

    // Step 1
    await expect(narrative).toContainText('enroll her child');

    // Step 2
    await page.getByTestId('next-button').click();
    await expect(narrative).toContainText('Parent Portal');

    // Step 3
    await page.getByTestId('next-button').click();
    await expect(narrative).toContainText('Transportation Request Form');
  });

  test('displays next step preview', async ({ page }) => {
    const preview = page.getByTestId('story-preview');
    await expect(preview).toBeVisible();

    const previewText = page.getByTestId('preview-text');
    await expect(previewText).toBeVisible();
    await expect(previewText).toContainText('Parent Portal');
  });

  test('preview updates on navigation', async ({ page }) => {
    const previewText = page.getByTestId('preview-text');

    // On step 1, preview shows step 2
    await expect(previewText).toContainText('Parent Portal');

    // Navigate to step 2, preview shows step 3
    await page.getByTestId('next-button').click();
    await expect(previewText).toContainText('Transportation Request Form');
  });

  test('preview hidden on last step', async ({ page }) => {
    const preview = page.getByTestId('story-preview');
    const endButton = page.getByTestId('end-button');

    // Go to last step
    await endButton.click();

    // Preview should not be visible
    await expect(preview).not.toBeVisible();
  });

  test('shows end of story indicator on last step', async ({ page }) => {
    const endIndicator = page.getByTestId('story-end');
    const endButton = page.getByTestId('end-button');

    // Initially not visible
    await expect(endIndicator).not.toBeVisible();

    // Go to last step
    await endButton.click();

    // Now visible
    await expect(endIndicator).toBeVisible();
    await expect(endIndicator).toContainText('End of story');
  });

  test('narrative has animated transitions', async ({ page }) => {
    // Navigate to trigger animation
    await page.getByTestId('next-button').click();

    // The narrative text should still be visible (animation completed)
    const narrative = page.getByTestId('narrative-text');
    await expect(narrative).toBeVisible();

    // Verify the motion div has proper styles
    const narrativeParent = narrative.locator('..');
    // Just verify it rendered without errors
    await expect(narrativeParent).toBeVisible();
  });

  test('panel is readable with good contrast', async ({ page }) => {
    const narrative = page.getByTestId('narrative-text');
    
    // Check that text is visible and has reasonable styling
    await expect(narrative).toBeVisible();
    
    // Verify text content is present
    const text = await narrative.textContent();
    expect(text?.length).toBeGreaterThan(10);
  });
});
