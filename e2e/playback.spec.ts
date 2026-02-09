import { test, expect } from '@playwright/test';

test.describe('Playback Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await page.waitForSelector('[data-testid="playback-controls"]');
  });

  test('displays playback controls', async ({ page }) => {
    const controls = page.getByTestId('playback-controls');
    await expect(controls).toBeVisible();

    // Check all buttons exist
    await expect(page.getByTestId('play-pause-button')).toBeVisible();
    await expect(page.getByTestId('prev-button')).toBeVisible();
    await expect(page.getByTestId('next-button')).toBeVisible();
    await expect(page.getByTestId('reset-button')).toBeVisible();
  });

  test('displays step counter', async ({ page }) => {
    const counter = page.getByTestId('step-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('1 / 9');
  });

  test('displays progress slider', async ({ page }) => {
    const slider = page.getByTestId('progress-slider');
    await expect(slider).toBeVisible();
  });

  test('play button starts auto-advance', async ({ page }) => {
    const playButton = page.getByTestId('play-pause-button');
    const counter = page.getByTestId('step-counter');

    // Initially on step 1
    await expect(counter).toContainText('1 / 9');

    // Click play
    await playButton.click();

    // Wait for step to advance (step durations are 2-3 seconds)
    await page.waitForTimeout(3500);

    // Should have advanced at least one step
    const counterText = await counter.textContent();
    expect(counterText).not.toBe('1 / 9');
  });

  test('play button shows pause icon when playing', async ({ page }) => {
    const playButton = page.getByTestId('play-pause-button');

    // Initially shows play icon
    await expect(playButton).toContainText('▶');

    // Click to play
    await playButton.click();

    // Should show pause icon
    await expect(playButton).toContainText('⏸');

    // Click to pause
    await playButton.click();

    // Should show play icon again
    await expect(playButton).toContainText('▶');
  });

  test('next button advances step', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const counter = page.getByTestId('step-counter');

    await expect(counter).toContainText('1 / 9');
    await nextButton.click();
    await expect(counter).toContainText('2 / 9');
  });

  test('prev button goes back', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const prevButton = page.getByTestId('prev-button');
    const counter = page.getByTestId('step-counter');

    // Go forward
    await nextButton.click();
    await expect(counter).toContainText('2 / 9');

    // Go back
    await prevButton.click();
    await expect(counter).toContainText('1 / 9');
  });

  test('reset button goes to beginning', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const resetButton = page.getByTestId('reset-button');
    const counter = page.getByTestId('step-counter');

    // Go forward a few steps
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();
    await expect(counter).toContainText('4 / 9');

    // Reset
    await resetButton.click();
    await expect(counter).toContainText('1 / 9');
  });

  test('slider allows seeking to any step', async ({ page }) => {
    const slider = page.getByTestId('progress-slider');
    const counter = page.getByTestId('step-counter');

    // Get slider bounding box
    const box = await slider.boundingBox();
    if (!box) throw new Error('Slider not found');

    // Click near the end of the slider to jump to later step
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);

    // Should have jumped forward
    const counterText = await counter.textContent();
    const stepNum = parseInt(counterText?.split('/')[0].trim() || '1', 10);
    expect(stepNum).toBeGreaterThan(4);
  });

  test('progress bar updates on step change', async ({ page }) => {
    const progressFill = page.getByTestId('progress-fill');
    const nextButton = page.getByTestId('next-button');

    // Get initial width
    const initialStyle = await progressFill.getAttribute('style');

    // Advance a step
    await nextButton.click();

    // Width should have increased
    await page.waitForTimeout(300); // Wait for animation
    const newStyle = await progressFill.getAttribute('style');
    expect(newStyle).not.toBe(initialStyle);
  });

  test('keyboard shortcut: Space toggles play/pause', async ({ page }) => {
    const playButton = page.getByTestId('play-pause-button');

    // Initially not playing
    await expect(playButton).toContainText('▶');

    // Press space
    await page.keyboard.press('Space');

    // Should be playing
    await expect(playButton).toContainText('⏸');

    // Press space again
    await page.keyboard.press('Space');

    // Should be paused
    await expect(playButton).toContainText('▶');
  });

  test('keyboard shortcut: Arrow Right advances step', async ({ page }) => {
    const counter = page.getByTestId('step-counter');

    await expect(counter).toContainText('1 / 9');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('2 / 9');
  });

  test('keyboard shortcut: Arrow Left goes back', async ({ page }) => {
    const counter = page.getByTestId('step-counter');

    // Go forward first
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('2 / 9');

    // Go back
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText('1 / 9');
  });

  test('keyboard shortcut: Home resets to beginning', async ({ page }) => {
    const counter = page.getByTestId('step-counter');

    // Go forward a few steps
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('4 / 9');

    // Press Home
    await page.keyboard.press('Home');
    await expect(counter).toContainText('1 / 9');
  });

  test('keyboard shortcut: End goes to last step', async ({ page }) => {
    const counter = page.getByTestId('step-counter');

    await expect(counter).toContainText('1 / 9');
    await page.keyboard.press('End');
    await expect(counter).toContainText('9 / 9');
  });

  test('prev button disabled on first step', async ({ page }) => {
    const prevButton = page.getByTestId('prev-button');
    await expect(prevButton).toBeDisabled();
  });

  test('next button disabled on last step', async ({ page }) => {
    const nextButton = page.getByTestId('next-button');
    const endButton = page.getByTestId('end-button');

    // Go to end
    await endButton.click();

    // Next should be disabled
    await expect(nextButton).toBeDisabled();
  });
});
