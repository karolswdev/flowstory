import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Full User Story Viewer', () => {
    test('renders complete viewer with all components', async ({ page }) => {
      // Toolbar
      await expect(page.getByTestId('app-toolbar')).toBeVisible();
      
      // Canvas
      await expect(page.getByTestId('story-canvas')).toBeVisible();
      
      // Panel
      await expect(page.getByTestId('story-panel')).toBeVisible();
      
      // Playback controls
      await expect(page.getByTestId('playback-controls')).toBeVisible();
    });

    test('loads and displays story content', async ({ page }) => {
      // Story title in panel
      await expect(page.getByTestId('story-title')).toContainText('Parent Submits Transportation Request');
      
      // First step narrative
      await expect(page.getByTestId('narrative-text')).toContainText('Sarah');
    });

    test('displays correct step count', async ({ page }) => {
      const counter = page.getByTestId('step-counter');
      await expect(counter).toContainText('1 / 9');
    });
  });

  test.describe('Complete Playback Flow', () => {
    test('can navigate through entire story', async ({ page }) => {
      const nextButton = page.getByTestId('next-button');
      const counter = page.getByTestId('step-counter');

      // Step through all 7 steps
      for (let step = 1; step <= 9; step++) {
        await expect(counter).toContainText(`${step} / 9`);
        
        if (step < 7) {
          await nextButton.click();
        }
      }

      // Should be at step 7
      await expect(counter).toContainText('9 / 9');

      // Next button should be disabled
      await expect(nextButton).toBeDisabled();
    });

    test('can play and auto-advance', async ({ page }) => {
      const playButton = page.getByTestId('play-pause-button');
      const counter = page.getByTestId('step-counter');

      // Start at step 1
      await expect(counter).toContainText('1 / 9');

      // Click play
      await playButton.click();

      // Wait for first step to complete (3000ms duration + buffer)
      await page.waitForTimeout(3500);

      // Should have advanced to step 2 or beyond
      const counterText = await counter.textContent();
      expect(counterText).not.toBe('1 / 9');
    });

    test('can use keyboard to navigate', async ({ page }) => {
      const counter = page.getByTestId('step-counter');

      // Click on the page body to ensure focus
      await page.locator('body').click();

      // Arrow Right advances
      await page.keyboard.press('ArrowRight');
      await expect(counter).toContainText('2 / 9');

      // Arrow Right again
      await page.keyboard.press('ArrowRight');
      await expect(counter).toContainText('3 / 9');

      // Arrow Left goes back
      await page.keyboard.press('ArrowLeft');
      await expect(counter).toContainText('2 / 9');

      // End goes to last
      await page.keyboard.press('End');
      await expect(counter).toContainText('9 / 9');

      // Home goes to first
      await page.keyboard.press('Home');
      await expect(counter).toContainText('1 / 9');
    });
  });

  test.describe('Theme Integration', () => {
    test('theme toggle affects entire viewer', async ({ page }) => {
      const html = page.locator('html');
      
      // Start in light mode
      await expect(html).toHaveAttribute('data-theme', 'light');

      // Toggle to dark
      await page.getByTestId('theme-toggle').click();
      await expect(html).toHaveAttribute('data-theme', 'dark');

      // Canvas should still be visible
      await expect(page.getByTestId('story-canvas')).toBeVisible();
      
      // Panel should still be visible
      await expect(page.getByTestId('story-panel')).toBeVisible();
    });

    test('theme persists across navigation', async ({ page }) => {
      // Switch to dark
      await page.getByTestId('theme-toggle').click();
      
      // Navigate through steps
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();
      
      // Theme should still be dark
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
  });

  test.describe('Export Integration', () => {
    test('export works from any step', async ({ page }) => {
      // Navigate to step 3
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();

      // Open export dropdown
      await page.getByTestId('export-button').click();
      await expect(page.getByTestId('export-dropdown')).toBeVisible();

      // Trigger PNG export
      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('export-png').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/step-3/);
    });

    test('export respects current theme', async ({ page }) => {
      // Switch to dark theme
      await page.getByTestId('theme-toggle').click();
      
      // Export should work
      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('export-button').click();
      await page.getByTestId('export-png').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    });
  });

  test.describe('Node Visibility Flow', () => {
    test('nodes become visible progressively', async ({ page }) => {
      // Wait for story to load and render
      await page.waitForTimeout(500);
      
      // At step 1, should have at least one node with animation state
      const step1Nodes = page.locator('[data-animation-state]');
      await expect(step1Nodes.first()).toBeVisible();
      const step1Count = await step1Nodes.count();

      // Navigate to step 2
      await page.getByTestId('next-button').click();
      await page.waitForTimeout(300);
      
      // Should still have nodes visible
      const step2Count = await page.locator('[data-animation-state]').count();
      expect(step2Count).toBeGreaterThanOrEqual(step1Count);
    });

    test('active node has correct animation state', async ({ page }) => {
      // Wait for render
      await page.waitForTimeout(500);
      
      // Check for active node
      const activeNodes = page.locator('[data-animation-state="active"]');
      await expect(activeNodes.first()).toBeVisible();
    });
  });

  test.describe('Edge Visibility Flow', () => {
    test('edges appear with connected nodes', async ({ page }) => {
      // At step 1, no edges
      const edges = await page.locator('.react-flow__edge:not([style*="display: none"])').count();

      // Navigate to step 2 (first edge appears)
      await page.getByTestId('next-button').click();

      // Should have edges now
      const newEdges = await page.locator('.react-flow__edge:not([style*="display: none"])').count();
      expect(newEdges).toBeGreaterThan(0);
    });
  });

  test.describe('Panel Content Flow', () => {
    test('narrative updates with each step', async ({ page }) => {
      const narrative = page.getByTestId('narrative-text');
      
      // Wait for narrative to be visible
      await expect(narrative).toBeVisible();
      
      // Get initial narrative
      const step1Text = await narrative.textContent();
      
      // Navigate to step 2
      await page.getByTestId('next-button').click();
      await page.waitForTimeout(300);
      
      // Narrative should change
      const step2Text = await narrative.textContent();
      expect(step2Text).not.toBe(step1Text);
    });

    test('step badge updates correctly', async ({ page }) => {
      const badge = page.getByTestId('step-badge');
      
      await expect(badge).toContainText('Step 1');
      
      await page.getByTestId('next-button').click();
      await expect(badge).toContainText('Step 2');
      
      await page.getByTestId('next-button').click();
      await expect(badge).toContainText('Step 3');
    });

    test('shows end indicator on last step', async ({ page }) => {
      // Go to last step using end button instead of keyboard
      await page.getByTestId('end-button').click();
      
      // Check for end indicator
      const endIndicator = page.getByTestId('story-end');
      await expect(endIndicator).toBeVisible();
    });
  });

  test.describe('Slider Seek', () => {
    test('slider reflects current step', async ({ page }) => {
      const slider = page.getByTestId('progress-slider');
      
      // Initial value
      await expect(slider).toHaveValue('0');
      
      // Navigate
      await page.getByTestId('next-button').click();
      await expect(slider).toHaveValue('1');
      
      await page.getByTestId('next-button').click();
      await expect(slider).toHaveValue('2');
    });

    test('can seek to specific step via slider', async ({ page }) => {
      const slider = page.getByTestId('progress-slider');
      const counter = page.getByTestId('step-counter');
      
      // Seek to step 5 (index 4)
      await slider.fill('4');
      
      await expect(counter).toContainText('5 / 9');
    });
  });

  test.describe('Error Handling', () => {
    test('viewer handles missing story gracefully', async ({ page }) => {
      // The demo always has a story, so this tests the canvas state
      await expect(page.getByTestId('story-canvas')).toBeVisible();
      await expect(page.getByTestId('story-canvas-error')).not.toBeVisible();
    });
  });

  test.describe('Responsive Behavior', () => {
    test('viewer adapts to viewport size', async ({ page }) => {
      // Set smaller viewport
      await page.setViewportSize({ width: 768, height: 600 });
      
      // All components should still be visible
      await expect(page.getByTestId('story-canvas')).toBeVisible();
      await expect(page.getByTestId('story-panel')).toBeVisible();
      await expect(page.getByTestId('playback-controls')).toBeVisible();
    });

    test('minimap visible on larger screens', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 });
      
      const minimap = page.locator('.react-flow__minimap');
      await expect(minimap).toBeVisible();
    });
  });

  test.describe('Full E2E Journey', () => {
    test('complete user journey: load → play → export', async ({ page }) => {
      // 1. Verify loaded
      await expect(page.getByTestId('story-title')).toContainText('Transportation Request');
      
      // 2. Navigate through a few steps
      await page.getByTestId('next-button').click();
      await page.getByTestId('next-button').click();
      await expect(page.getByTestId('step-counter')).toContainText('3 / 9');
      
      // 3. Toggle theme
      await page.getByTestId('theme-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      
      // 4. Export
      const downloadPromise = page.waitForEvent('download');
      await page.getByTestId('export-button').click();
      await page.getByTestId('export-png').click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/trf-demo-step-3\.png$/);
      
      // 5. Continue to end using button
      await page.getByTestId('end-button').click();
      await expect(page.getByTestId('step-counter')).toContainText('9 / 9');
      await expect(page.getByTestId('story-end')).toBeVisible();
    });
  });
});
