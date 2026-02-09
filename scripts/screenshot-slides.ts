/**
 * Screenshot Pipeline for Visual Verification
 * 
 * Captures a screenshot at each step of a story for visual inspection.
 * 
 * Usage:
 *   npx tsx scripts/screenshot-slides.ts [story-id]
 * 
 * Example:
 *   npx tsx scripts/screenshot-slides.ts arch-trf-processing
 *   npx tsx scripts/screenshot-slides.ts trf-new-submission
 * 
 * Story IDs (from App.tsx):
 *   - trf-new-submission (default)
 *   - trf-admin-review
 *   - driver-completes-run
 *   - parent-tracking
 *   - no-show-detection
 *   - sgr-generation
 *   - arch-overview
 *   - arch-trf-processing
 *   - arch-rescue
 *   - arch-settlement
 *   - arch-assignment
 * 
 * Output:
 *   screenshots/<story-id>/step-01.png
 *   screenshots/<story-id>/step-02.png
 *   ...
 */

import { chromium, type Page } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DEV_SERVER_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'screenshots';

async function waitForCanvasReady(page: Page): Promise<void> {
  // Wait for either React Flow canvas OR Architectural canvas
  try {
    await page.waitForSelector('.react-flow, [data-testid="architectural-canvas"]', { timeout: 15000 });
    // For React Flow, wait for at least one node; for Architectural, wait for canvas content
    const isArchitectural = await page.locator('[data-testid="architectural-canvas"]').isVisible().catch(() => false);
    if (!isArchitectural) {
      await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    }
    // Wait for animations to settle
    await page.waitForTimeout(1000);
  } catch (err) {
    // Try just waiting for the story panel as fallback
    await page.waitForSelector('.story-panel, [data-testid="story-panel"]', { timeout: 5000 });
    await page.waitForTimeout(1000);
  }
}

async function getStepInfo(page: Page): Promise<{ current: number; total: number }> {
  // Look for step indicator in PlaybackControls (format: "1 / 9")
  const stepText = await page.locator('.step-counter, [data-testid="step-counter"]').textContent({ timeout: 5000 }).catch(() => null);
  if (stepText) {
    const match = stepText.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1], 10), total: parseInt(match[2], 10) };
    }
  }
  return { current: 1, total: 1 };
}

async function selectStory(page: Page, storyId: string, outputDir: string): Promise<boolean> {
  try {
    // Find the story selector dropdown
    const selector = page.locator('#story-select');
    
    // Check if selector exists
    if (!(await selector.isVisible({ timeout: 5000 }))) {
      console.log('⚠️ Story selector not visible');
      return false;
    }
    
    // Get available options
    const options = await selector.locator('option').allTextContents();
    console.log(`📋 Available stories: ${options.length}`);
    
    // Try to select the story
    await selector.selectOption(storyId);
    console.log(`✓ Selected: ${storyId}`);
    
    // Wait for story to load
    await page.waitForTimeout(1000);
    await waitForCanvasReady(page);
    return true;
  } catch (err) {
    console.log(`⚠️ Could not select story: ${err}`);
    // Take debug screenshot
    await page.screenshot({ path: join(outputDir, 'debug-select-error.png') });
    return false;
  }
}

async function captureFullPage(page: Page, outputPath: string): Promise<void> {
  await page.screenshot({ 
    path: outputPath,
    fullPage: false,
    animations: 'disabled'
  });
}

async function runScreenshotPipeline(storyId?: string): Promise<void> {
  console.log('🎬 Starting Screenshot Pipeline\n');

  const story = storyId || 'trf-new-submission';
  const outputDir = join(SCREENSHOT_DIR, story);

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`📁 Story: ${story}`);
  console.log(`📂 Output: ${outputDir}/\n`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 Page error: ${msg.text()}`);
    }
  });

  try {
    // Navigate to app
    console.log(`🌐 Loading: ${DEV_SERVER_URL}`);
    await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' });
    
    // Take initial debug screenshot
    await page.screenshot({ path: join(outputDir, 'debug-initial.png') });
    console.log('📸 Saved debug-initial.png');
    
    await waitForCanvasReady(page);

    // Select the story (if different from default)
    if (story !== 'trf-new-submission') {
      console.log(`📚 Selecting story: ${story}`);
      const selected = await selectStory(page, story, outputDir);
      if (!selected) {
        console.log('⚠️ Using default story instead');
      }
    }

    // Reset to step 1
    await page.keyboard.press('Home');
    await page.waitForTimeout(500);

    // Get total steps
    const stepInfo = await getStepInfo(page);
    console.log(`📊 Total steps: ${stepInfo.total}\n`);

    // Capture each step
    for (let step = 1; step <= stepInfo.total; step++) {
      const filename = `step-${step.toString().padStart(2, '0')}.png`;
      const filepath = join(outputDir, filename);
      
      await captureFullPage(page, filepath);
      console.log(`📸 Captured: ${filename}`);

      // Navigate to next step (unless last)
      if (step < stepInfo.total) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500); // Wait for transition
      }
    }

    // Summary
    console.log(`\n✅ Complete! ${stepInfo.total} screenshots saved to ${outputDir}/`);

  } catch (error) {
    console.error('❌ Error:', error);
    // Take error screenshot for debugging
    const errorPath = join(outputDir, 'error.png');
    await page.screenshot({ path: errorPath });
    console.log(`📸 Error screenshot saved to ${errorPath}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// CLI entry point
const storyArg = process.argv[2];
runScreenshotPipeline(storyArg).catch((err) => {
  console.error(err);
  process.exit(1);
});
