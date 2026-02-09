import { test, expect } from '@playwright/test';

test.describe('Story Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await page.waitForSelector('[data-testid="story-canvas"]');
  });

  test('canvas loads and displays story', async ({ page }) => {
    const canvas = page.getByTestId('story-canvas');
    await expect(canvas).toBeVisible();

    // Should have React Flow rendered
    await expect(page.locator('.react-flow')).toBeVisible();
  });

  test('displays playback controls', async ({ page }) => {
    const controls = page.getByTestId('playback-controls');
    await expect(controls).toBeVisible();

    // Should have prev/next buttons
    await expect(page.getByTestId('prev-button')).toBeVisible();
    await expect(page.getByTestId('next-button')).toBeVisible();
  });

  test('displays step counter', async ({ page }) => {
    const counter = page.getByTestId('step-counter');
    await expect(counter).toBeVisible();

    // Should show "1 / 9" initially
    await expect(counter).toContainText('1 / 9');
  });

  test('prev button is disabled on first step', async ({ page }) => {
    const prevButton = page.getByTestId('prev-button');
    await expect(prevButton).toBeDisabled();
  });

  test('next button advances to next step', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const counter = page.getByTestId('step-counter');

    // Click next
    await nextButton.click();
    
    // Should now be on step 2
    await expect(counter).toContainText('2 / 9');
  });

  test('prev button goes back to previous step', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const prevButton = page.getByTestId('prev-button');
    const counter = page.getByTestId('step-counter');

    // Go to step 2
    await nextButton.click();
    await expect(counter).toContainText('2 / 9');

    // Go back
    await prevButton.click();
    await expect(counter).toContainText('1 / 9');
  });

  test('prev button becomes enabled after advancing', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const prevButton = page.getByTestId('prev-button');

    // Initially disabled
    await expect(prevButton).toBeDisabled();

    // Advance
    await nextButton.click();

    // Now enabled
    await expect(prevButton).toBeEnabled();
  });

  test('next button becomes disabled on last step', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const endButton = page.getByTestId('end-button');

    // Go to last step
    await endButton.click();

    // Should be disabled
    await expect(nextButton).toBeDisabled();
  });

  test('nodes become visible when activated', async ({ page }) => {
    // On step 1, only the actor node should be visible
    const actorNode = page.getByTestId('actor-node');
    await expect(actorNode).toBeVisible();

    // Action nodes should be hidden initially
    const actionNodes = page.getByTestId('action-node');
    await expect(actionNodes).toHaveCount(0);

    // Advance to step 2
    await page.getByTestId('next-button').click();

    // Now first action node should be visible
    await expect(page.getByTestId('action-node')).toHaveCount(1);
  });

  test('shows story panel', async ({ page }) => {
    const panel = page.getByTestId('story-panel');
    await expect(panel).toBeVisible();

    const text = page.getByTestId('narrative-text');
    await expect(text).toContainText('Sarah');
  });

  test('narrative updates on step change', async ({ page }) => {
    const text = page.getByTestId('narrative-text');

    // Step 1 narrative
    await expect(text).toContainText('enroll her child');

    // Advance
    await page.getByTestId('next-button').click();

    // Step 2 narrative
    await expect(text).toContainText('Parent Portal');
  });

  test('minimap is displayed', async ({ page }) => {
    const minimap = page.locator('.react-flow__minimap');
    await expect(minimap).toBeVisible();
  });

  test('controls are displayed', async ({ page }) => {
    const controls = page.locator('.react-flow__controls');
    await expect(controls).toBeVisible();
  });

  test('background grid is displayed', async ({ page }) => {
    const background = page.locator('.react-flow__background');
    await expect(background).toBeVisible();
  });
});
