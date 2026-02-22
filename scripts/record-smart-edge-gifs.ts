/**
 * Record high-framerate GIFs for Smart Edge Handle verification
 *
 * Uses Playwright's native video recording to capture smooth animations
 * (node transitions, edge drawing, camera moves) then converts to GIF.
 *
 * Usage:
 *   npx tsx scripts/record-smart-edge-gifs.ts            # all 5 canvases
 *   npx tsx scripts/record-smart-edge-gifs.ts pipeline    # single canvas
 *
 * Prerequisites:
 *   - Dev server running on localhost:5173
 *   - ffmpeg installed
 *   - Playwright browsers installed
 */

import { chromium, type Page, type BrowserContext } from 'playwright';
import { mkdirSync, renameSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';

const DEV_SERVER_URL = process.env.DEV_SERVER_URL || 'http://localhost:5173';
const VIDEO_DIR = 'screenshots/smart-edges/videos';
const GIF_DIR = 'docs/demos';
const FPS = 15; // Recording framerate — smooth enough to see animations
const GIF_FPS = 12; // Output GIF framerate (slightly lower to reduce file size)
const STEP_DWELL_MS = 2500; // How long to dwell on each step (let animations play)

/** Canvas configs with known step counts */
const CANVASES = [
  { id: 'service-order-processing', name: 'ServiceFlow',   steps: 5,  waitSelector: '.service-flow-canvas' },
  { id: 'http-user-creation',       name: 'HttpFlow',      steps: 3,  waitSelector: '.http-flow-canvas' },
  { id: 'pipeline-cicd',            name: 'Pipeline',      steps: 16, waitSelector: '.pipeline-canvas' },
  { id: 'bc-order-service',         name: 'BCDeployment',  steps: 6,  waitSelector: '.bc-deployment-canvas' },
  { id: 'bc-composition-order',     name: 'BCComposition', steps: 7,  waitSelector: '.bc-composition-canvas' },
];

async function waitForCanvas(page: Page, selector: string): Promise<void> {
  await page.waitForSelector(selector, { timeout: 15000, state: 'attached' });
  await page.waitForSelector('.react-flow__node', { timeout: 10000 }).catch(() => {});
  // Let initial render + fit-view animation settle
  await page.waitForTimeout(2000);
}

async function detectStepCount(page: Page): Promise<number> {
  // Try .step-counter (PlaybackControls for story-flow)
  let text = await page.locator('.step-counter').textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try .step-badge (specialized canvas overlays: "Step 1 / 5")
  text = await page.locator('.step-badge').first().textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try step-dot count (BC canvases use dot navigation)
  const dotCount = await page.locator('.bc-step-dot').count().catch(() => 0);
  if (dotCount > 0) return dotCount;
  return 1;
}

async function recordCanvas(canvas: typeof CANVASES[number]): Promise<string | null> {
  console.log(`\n📹 Recording ${canvas.name} (${canvas.id})`);

  const videoDir = join(VIDEO_DIR, canvas.id);
  mkdirSync(videoDir, { recursive: true });

  // Each canvas gets its own browser context with video recording enabled
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();

  // Suppress noisy console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ResizeObserver') && !text.includes('Warning:')) {
        console.log(`   🔴 ${text.slice(0, 100)}`);
      }
    }
  });

  try {
    // Navigate and wait for canvas
    await page.goto(`${DEV_SERVER_URL}?story=${canvas.id}`, { waitUntil: 'networkidle' });
    await waitForCanvas(page, canvas.waitSelector);

    // Detect steps
    const detected = await detectStepCount(page);
    const totalSteps = Math.max(detected, canvas.steps);
    console.log(`   Steps: ${totalSteps} (detected: ${detected}, config: ${canvas.steps})`);

    // Reset to step 1
    await page.keyboard.press('Home');
    await page.waitForTimeout(1200); // Let Home animation play

    // Dwell on step 1 so viewer sees initial state
    await page.waitForTimeout(STEP_DWELL_MS);

    // Walk through each step
    for (let step = 2; step <= totalSteps; step++) {
      console.log(`   ▶ Step ${step}/${totalSteps}`);
      await page.keyboard.press('ArrowRight');
      // Dwell to capture the full transition animation + settled state
      await page.waitForTimeout(STEP_DWELL_MS);
    }

    // Extra dwell on final state
    await page.waitForTimeout(1500);

  } catch (err) {
    console.error(`   ❌ Recording failed: ${err}`);
  }

  // Close page to finalize the video
  await page.close();
  const video = page.video();
  const videoPath = video ? await video.path() : null;

  await context.close();
  await browser.close();

  if (videoPath && existsSync(videoPath)) {
    // Rename to a predictable name
    const destPath = join(VIDEO_DIR, `${canvas.id}.webm`);
    renameSync(videoPath, destPath);
    console.log(`   📼 Video: ${destPath}`);
    return destPath;
  }

  console.log(`   ⚠️ No video file produced`);
  return null;
}

function convertToGif(videoPath: string, canvasId: string, name: string): string | null {
  const outputFile = join(GIF_DIR, `smart-edges-${canvasId}.gif`);

  try {
    // Two-pass: generate palette then apply it for high-quality GIF
    execSync(
      `ffmpeg -y -i '${videoPath}' ` +
      `-vf "fps=${GIF_FPS},scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" ` +
      `-loop 0 '${outputFile}'`,
      { stdio: 'pipe' }
    );

    // Report file size
    const sizeKB = Math.round(execSync(`stat -f%z '${outputFile}'`).toString().trim() as any / 1024);
    console.log(`   🎬 ${outputFile} (${sizeKB} KB)`);
    return outputFile;
  } catch (err) {
    console.error(`   ❌ ffmpeg failed for ${name}: ${(err as Error).message?.slice(0, 100)}`);
    return null;
  }
}

async function main() {
  console.log('🎬 Smart Edge Handle — High-Framerate GIF Recorder');
  console.log(`   Server: ${DEV_SERVER_URL}`);
  console.log(`   Video:  ${VIDEO_DIR}/`);
  console.log(`   GIFs:   ${GIF_DIR}/`);
  console.log(`   FPS:    ${FPS} capture → ${GIF_FPS} GIF`);
  console.log(`   Dwell:  ${STEP_DWELL_MS}ms per step`);

  mkdirSync(GIF_DIR, { recursive: true });
  mkdirSync(VIDEO_DIR, { recursive: true });

  // Filter to specific canvas if arg provided
  const filterArg = process.argv[2];
  const targets = filterArg
    ? CANVASES.filter(c => c.id.includes(filterArg) || c.name.toLowerCase().includes(filterArg.toLowerCase()))
    : CANVASES;

  if (targets.length === 0) {
    console.error(`\n❌ No canvas matching "${filterArg}". Available: ${CANVASES.map(c => c.id).join(', ')}`);
    process.exit(1);
  }

  // Record videos sequentially (each needs its own browser context)
  const videos: Array<{ canvas: typeof CANVASES[number]; path: string }> = [];
  for (const canvas of targets) {
    const videoPath = await recordCanvas(canvas);
    if (videoPath) {
      videos.push({ canvas, path: videoPath });
    }
  }

  // Convert all videos to GIFs
  console.log('\n\n=== Converting to GIFs ===\n');
  const gifs: string[] = [];
  for (const { canvas, path } of videos) {
    const gif = convertToGif(path, canvas.id, canvas.name);
    if (gif) gifs.push(gif);
  }

  console.log(`\n✅ Done! ${gifs.length} GIFs saved to ${GIF_DIR}/`);
  if (gifs.length > 0) {
    console.log('\nGenerated files:');
    gifs.forEach(g => console.log(`  ${g}`));
  }
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
