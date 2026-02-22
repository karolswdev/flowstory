/**
 * CLI GIF Recorder for FlowStory
 *
 * Records any story (by ID or YAML file path) as an animated GIF using
 * Playwright video capture + ffmpeg two-pass conversion.
 *
 * Usage:
 *   npx tsx scripts/record-gif.ts <story-id-or-file> [options]
 *
 * Options:
 *   --output, -o    Output GIF path (default: <name>.gif)
 *   --fps           GIF framerate (default: 12)
 *   --dwell         Dwell time per step in ms (default: 2500)
 *   --width         Viewport width (default: 1440)
 *   --height        Viewport height (default: 900)
 *   --scale         Output GIF width in px (default: 960)
 *   --server        Dev server URL (default: http://localhost:5173)
 *   --clean         Canvas only — hide toolbar, panels, controls; add watermark
 *
 * Examples:
 *   npx tsx scripts/record-gif.ts service-order-processing --clean
 *   npx tsx scripts/record-gif.ts ./stories/service/order-processing.yaml -o demo.gif
 *   npx tsx scripts/record-gif.ts pipeline-cicd --dwell 3000
 *
 * Prerequisites:
 *   - Dev server running on localhost:5173 (or specify --server)
 *   - ffmpeg installed
 *   - Playwright browsers installed
 */

import { chromium, type Page } from 'playwright';
import { readFileSync, mkdirSync, renameSync, existsSync, unlinkSync } from 'fs';
import { join, basename, resolve } from 'path';
import { execSync } from 'child_process';

// ── CLI Argument Parsing ──

interface CliOptions {
  input: string;
  output: string;
  fps: number;
  dwell: number;
  width: number;
  height: number;
  scale: number;
  server: string;
  clean: boolean;
}

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/record-gif.ts <story-id-or-file> [options]

Arguments:
  story-id-or-file   Story catalog ID (e.g. "service-order-processing")
                     or path to a YAML file (e.g. "./my-story.yaml")

Options:
  --output, -o    Output GIF path (default: <name>.gif)
  --fps           GIF framerate (default: 12)
  --dwell         Dwell time per step in ms (default: 2500)
  --width         Viewport width (default: 1440)
  --height        Viewport height (default: 900)
  --scale         Output GIF width in px (default: 960)
  --server        Dev server URL (default: http://localhost:5173)
  --clean         Canvas only — hide toolbar, panels, controls; add watermark

Examples:
  npx tsx scripts/record-gif.ts service-order-processing --clean
  npx tsx scripts/record-gif.ts ./stories/service/order-processing.yaml -o demo.gif
  npx tsx scripts/record-gif.ts pipeline-cicd --dwell 3000 --fps 15 --clean
`);
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const input = args[0];
  const defaults: Omit<CliOptions, 'input' | 'output'> = {
    fps: 12,
    dwell: 2500,
    width: 1440,
    height: 900,
    scale: 960,
    server: 'http://localhost:5173',
    clean: false,
  };

  let output = '';
  const opts = { ...defaults };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--output':
      case '-o':
        output = next;
        i++;
        break;
      case '--fps':
        opts.fps = parseInt(next, 10);
        i++;
        break;
      case '--dwell':
        opts.dwell = parseInt(next, 10);
        i++;
        break;
      case '--width':
        opts.width = parseInt(next, 10);
        i++;
        break;
      case '--height':
        opts.height = parseInt(next, 10);
        i++;
        break;
      case '--scale':
        opts.scale = parseInt(next, 10);
        i++;
        break;
      case '--server':
        opts.server = next;
        i++;
        break;
      case '--clean':
        opts.clean = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  // Determine if input is a file path or story ID
  const isFile = input.includes('/') || input.includes('\\') || input.endsWith('.yaml') || input.endsWith('.yml');

  // Default output name
  if (!output) {
    if (isFile) {
      output = basename(input).replace(/\.(yaml|yml)$/, '') + '.gif';
    } else {
      output = input + '.gif';
    }
  }

  return { input, output, ...opts };
}

// ── Canvas Detection & Step Navigation ──

async function waitForCanvasReady(page: Page): Promise<void> {
  try {
    await page.waitForSelector(
      '.react-flow, [data-testid="architectural-canvas"], .bc-deployment-canvas, .pipeline-canvas, .service-flow-canvas, .http-flow-canvas, .bc-composition-canvas, .state-diagram-canvas, .es-canvas, .step-overlay',
      { timeout: 15000 }
    );
    // Wait for nodes to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 }).catch(() => {});
    // Let initial render + fit-view animation settle
    await page.waitForTimeout(2000);
  } catch {
    // Fallback: wait for any story panel or step overlay
    await page.waitForSelector('.story-panel, [data-testid="story-panel"], .bc-step-overlay, .step-overlay', { timeout: 5000 });
    await page.waitForTimeout(1000);
  }
}

async function detectStepCount(page: Page): Promise<number> {
  // Try .step-counter (PlaybackControls)
  let text = await page.locator('.step-counter').textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try .step-badge (specialized canvas overlays)
  text = await page.locator('.step-badge').first().textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try .es-nav span (event-storming canvas)
  text = await page.locator('.es-nav span').textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try StepOverlay badge (shared component: "Step 1 / 5")
  text = await page.locator('.step-overlay__badge').first().textContent({ timeout: 1500 }).catch(() => null);
  if (text) {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[2], 10);
  }
  // Try step-dot count (BC canvases)
  const dotCount = await page.locator('.bc-step-dot').count().catch(() => 0);
  if (dotCount > 0) return dotCount;
  // Try StepOverlay dots (shared component used by most renderers)
  const overlayDots = await page.locator('.step-overlay__dot').count().catch(() => 0);
  if (overlayDots > 0) return overlayDots;
  // Try progress dots (presentation mode)
  const progressDots = await page.locator('.progress-dot').count().catch(() => 0);
  if (progressDots > 0) return progressDots;
  return 1;
}

// ── Input Type Detection ──

function isFilePath(input: string): boolean {
  return input.includes('/') || input.includes('\\') || input.endsWith('.yaml') || input.endsWith('.yml');
}

// ── Main Recording Flow ──

async function recordGif(opts: CliOptions): Promise<void> {
  const isFile = isFilePath(opts.input);
  let yamlContent: string | null = null;

  // If input is a file, read it now
  if (isFile) {
    const filePath = resolve(opts.input);
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    yamlContent = readFileSync(filePath, 'utf-8');
    console.log(`   Source: ${filePath}`);
  } else {
    console.log(`   Story ID: ${opts.input}`);
  }

  console.log(`   Output: ${opts.output}`);
  console.log(`   Viewport: ${opts.width}x${opts.height}`);
  console.log(`   GIF: ${opts.scale}px wide @ ${opts.fps}fps`);
  console.log(`   Dwell: ${opts.dwell}ms per step`);
  if (opts.clean) console.log(`   Mode: clean (canvas only + watermark)`);

  // Set up temp video directory
  const videoDir = join('.tmp', 'record-gif-video');
  mkdirSync(videoDir, { recursive: true });

  // Launch Playwright with video recording
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
    recordVideo: {
      dir: videoDir,
      size: { width: opts.width, height: opts.height },
    },
  });
  const page = await context.newPage();

  // Suppress noisy console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ResizeObserver') && !text.includes('Warning:')) {
        console.log(`   [page error] ${text.slice(0, 120)}`);
      }
    }
  });

  // If custom YAML file, intercept the story fetch
  if (isFile && yamlContent) {
    // Intercept any story file fetch and serve our custom YAML
    await page.route('**/stories/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/yaml',
        body: yamlContent!,
      });
    });
  }

  try {
    // Navigate to the app
    // For file input, we hijack a known catalog entry; the app's detectStoryType()
    // reads the renderer from the YAML content, so it picks the correct renderer.
    const storyId = isFile ? 'user-registration' : opts.input;
    const url = `${opts.server}?story=${storyId}`;
    console.log(`\n   Loading ${url}`);

    await page.goto(url, { waitUntil: 'networkidle' });
    await waitForCanvasReady(page);

    // Detect step count BEFORE hiding chrome (step counters may be in the chrome)
    const totalSteps = await detectStepCount(page);

    // In clean mode, hide all UI chrome so only the canvas is visible
    if (opts.clean) {
      await page.addStyleTag({
        content: `
          /* Hide toolbar, panels, playback controls */
          .app-toolbar,
          .story-panel,
          .playback-controls,
          .step-badge,
          .es-nav,
          .bc-step-overlay,
          .step-overlay,
          .pipeline-step-info,
          .service-flow-step-info,
          .http-flow-step-info,
          [data-hide-in-presentation],
          .react-flow__minimap,
          .react-flow__controls,
          .react-flow__attribution {
            display: none !important;
          }
          /* Let canvas fill the entire viewport */
          main {
            flex: 1 !important;
          }
        `,
      });
      // Let layout reflow after hiding chrome
      await page.waitForTimeout(500);
    }
    console.log(`   Detected ${totalSteps} steps`);

    // Reset to step 1
    await page.keyboard.press('Home');
    await page.waitForTimeout(1200);

    // Dwell on step 1
    await page.waitForTimeout(opts.dwell);

    // Detect if event-storming canvas (needs button clicks instead of keyboard)
    const hasEsNav = await page.locator('.es-nav').count().catch(() => 0);

    // Walk through each step
    for (let step = 2; step <= totalSteps; step++) {
      console.log(`   Step ${step}/${totalSteps}`);
      if (hasEsNav) {
        // Event-storming: click "Next →" button
        await page.locator('.es-nav button:last-child').click().catch(() => {});
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(opts.dwell);
    }

    // Extra dwell on final state
    await page.waitForTimeout(1500);

  } catch (err) {
    console.error(`   Recording failed: ${err}`);
  }

  // Close page to finalize the video
  await page.close();
  const video = page.video();
  const videoPath = video ? await video.path() : null;

  await context.close();
  await browser.close();

  if (!videoPath || !existsSync(videoPath)) {
    console.error('   No video file produced');
    process.exit(1);
  }

  // Rename to predictable path
  const destVideo = join(videoDir, 'recording.webm');
  renameSync(videoPath, destVideo);
  console.log(`\n   Video: ${destVideo}`);

  // Convert to GIF with ffmpeg two-pass
  console.log('   Converting to GIF...');
  convertToGif(destVideo, opts.output, opts.fps, opts.scale, opts.clean);

  // Clean up temp video
  try {
    unlinkSync(destVideo);
  } catch {
    // ignore cleanup errors
  }
}

const WATERMARK_TEXT = 'github.com/karolswdev/flowstory';

function convertToGif(videoPath: string, outputPath: string, fps: number, scale: number, clean: boolean): void {
  // Ensure output directory exists
  const outputDir = join(outputPath, '..');
  if (outputDir !== '.') {
    mkdirSync(outputDir, { recursive: true });
  }

  // Build the filter chain
  // Base: fps, scale, then split for palettegen two-pass
  let filters = `fps=${fps},scale=${scale}:-1:flags=lanczos`;

  // In clean mode, burn a subtle watermark into the bottom-right corner
  if (clean) {
    filters += `,drawtext=text='${WATERMARK_TEXT}':fontsize=13:fontcolor=white@0.45:x=w-tw-12:y=h-th-10`;
  }

  filters += `,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`;

  try {
    execSync(
      `ffmpeg -y -i '${videoPath}' ` +
      `-vf "${filters}" ` +
      `-loop 0 '${outputPath}'`,
      { stdio: 'pipe' }
    );

    // Report file size
    const stats = execSync(`stat -f%z '${outputPath}'`).toString().trim();
    const sizeKB = Math.round(parseInt(stats, 10) / 1024);
    console.log(`\n   ${outputPath} (${sizeKB} KB)`);
  } catch (err) {
    console.error(`   ffmpeg conversion failed: ${(err as Error).message?.slice(0, 200)}`);
    console.error('   Make sure ffmpeg is installed: brew install ffmpeg');
    process.exit(1);
  }
}

// ── Entry Point ──

async function main() {
  const opts = parseArgs();

  console.log('Record GIF — FlowStory CLI');
  console.log('─'.repeat(40));

  // Check ffmpeg availability
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    console.error('ffmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }

  await recordGif(opts);
  console.log('   Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
