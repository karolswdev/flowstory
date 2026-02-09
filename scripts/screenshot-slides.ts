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

const DEV_SERVER_URL = process.env.DEV_SERVER_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = 'screenshots';

async function waitForCanvasReady(page: Page): Promise<void> {
  // Wait for one of the canvas types: React Flow, Architectural, or BC Deployment
  try {
    await page.waitForSelector('.react-flow, [data-testid="architectural-canvas"], .bc-deployment-canvas', { timeout: 15000 });
    
    // Check which canvas type is visible
    const isBCDeployment = await page.locator('.bc-deployment-canvas').isVisible().catch(() => false);
    const isArchitectural = await page.locator('[data-testid="architectural-canvas"]').isVisible().catch(() => false);
    
    if (isBCDeployment) {
      // For BC Deployment, wait for the step overlay
      await page.waitForSelector('.bc-step-overlay', { timeout: 10000 });
    } else if (!isArchitectural) {
      await page.waitForSelector('.react-flow__node', { timeout: 15000 });
    }
    // Wait for animations to settle
    await page.waitForTimeout(1000);
  } catch (err) {
    // Try just waiting for the story panel as fallback
    await page.waitForSelector('.story-panel, [data-testid="story-panel"], .bc-step-overlay', { timeout: 5000 });
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
    
    // Try to select the story using multiple methods to trigger React
    // Method 1: Click on selector to focus it
    await selector.click();
    await page.waitForTimeout(100);
    
    // Method 2: Use selectOption which should work with native selects
    await selector.selectOption({ value: storyId });
    
    // Method 3: Trigger input event as well (React sometimes listens to this)
    await page.evaluate((id) => {
      const select = document.getElementById('story-select') as HTMLSelectElement;
      if (select) {
        select.value = id;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, storyId);
    
    console.log(`✓ Selected: ${storyId}`);
    
    // Check if this is a BC Deployment story
    const isBCDeployment = storyId.startsWith('bc-');
    
    // Wait for story to load - longer timeout for BC Deployment
    await page.waitForTimeout(isBCDeployment ? 2000 : 1000);
    
    if (isBCDeployment) {
      // For BC Deployment, wait for the canvas and step overlay
      console.log('⏳ Waiting for BC Deployment canvas...');
      
      // Debug: Check what's on the page
      const html = await page.content();
      const hasBCCanvas = html.includes('bc-deployment-canvas');
      const hasStoryCanvas = html.includes('story-canvas');
      console.log(`   Page state: bcCanvas=${hasBCCanvas}, storyCanvas=${hasStoryCanvas}`);
      
      // Check if bc-deployment-canvas element exists in DOM (regardless of visibility)
      const bcCanvasCount = await page.locator('.bc-deployment-canvas').count();
      console.log(`   BC canvas element count: ${bcCanvasCount}`);
      
      if (bcCanvasCount > 0) {
        // Element exists - check its dimensions
        const box = await page.locator('.bc-deployment-canvas').first().boundingBox();
        console.log(`   BC canvas bounding box: ${JSON.stringify(box)}`);
      }
      
      try {
        // Wait for any element with this class (not just visible)
        await page.waitForSelector('.bc-deployment-canvas', { timeout: 15000, state: 'attached' });
        // Then wait for it to be visible
        await page.waitForSelector('.bc-deployment-canvas', { timeout: 5000 });
        await page.waitForSelector('.bc-step-overlay', { timeout: 10000 });
        console.log('✓ BC Deployment canvas loaded');
      } catch (canvasErr) {
        // Take debug screenshot before failing
        await page.screenshot({ path: join(outputDir, 'debug-bc-wait-error.png') });
        
        // Dump page HTML for debugging
        const bodyHtml = await page.locator('main').innerHTML().catch(() => 'N/A');
        console.log(`   Main content snippet: ${bodyHtml.slice(0, 300)}...`);
        
        throw canvasErr;
      }
    } else {
      await waitForCanvasReady(page);
    }
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
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`🔴 Page error: ${text}`);
    } else if (text.includes('[FlowStory]')) {
      console.log(`📋 ${text}`);
    }
  });

  try {
    // Navigate directly to the story via URL parameter
    const storyUrl = `${DEV_SERVER_URL}?story=${story}`;
    console.log(`🌐 Loading: ${storyUrl}`);
    await page.goto(storyUrl, { waitUntil: 'networkidle' });
    
    // Take initial debug screenshot
    await page.screenshot({ path: join(outputDir, 'debug-initial.png') });
    console.log('📸 Saved debug-initial.png');
    
    // Check if this is a BC Deployment story
    const isBCDeployment = story.startsWith('bc-');
    
    if (isBCDeployment) {
      // Wait for BC Deployment canvas
      console.log('⏳ Waiting for BC Deployment canvas...');
      // Give React time to: 1) fetch YAML, 2) parse it, 3) update state, 4) render
      await page.waitForTimeout(5000);
      
      try {
        await page.waitForSelector('.bc-deployment-canvas', { timeout: 15000 });
        await page.waitForSelector('.bc-step-overlay', { timeout: 10000 });
        console.log('✓ BC Deployment canvas loaded');
      } catch {
        console.log('⚠️ BC Deployment canvas not found, checking page state...');
        const bcCount = await page.locator('.bc-deployment-canvas').count();
        console.log(`   BC canvas count: ${bcCount}`);
        await page.screenshot({ path: join(outputDir, 'debug-bc-error.png') });
      }
    } else {
      await waitForCanvasReady(page);
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
