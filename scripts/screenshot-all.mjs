import { chromium } from 'playwright';

// Parse command line args
const args = process.argv.slice(2);
const storyArg = args.find(a => a.startsWith('--story='));
const outputArg = args.find(a => a.startsWith('--output='));
const storyName = storyArg ? storyArg.split('=')[1] : 'Translation';
const outputPrefix = outputArg ? outputArg.split('=')[1] : 'screenshots/step';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });

// Try multiple hosts/ports
const targets = [
  'http://localhost:5173/',
  'http://localhost:4173/',
  'http://127.0.0.1:5173/',
  'http://127.0.0.1:4173/',
  'http://192.168.1.21:5173/',
  'http://192.168.1.21:4173/',
];
let connected = false;
for (const url of targets) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    console.log(`Connected to ${url}`);
    connected = true;
    break;
  } catch (e) {
    // silent
  }
}
if (!connected) {
  console.error('Could not connect to any server');
  await browser.close();
  process.exit(1);
}
await page.waitForTimeout(2000);

// Get all options from the story selector
const options = await page.$$eval('select#story-select option', opts => 
  opts.map(o => ({ value: o.value, text: o.textContent }))
);
console.log('Available stories:', options.map(o => o.text).join(', '));

// Find and select specified story
const targetOpt = options.find(o => o.text.toLowerCase().includes(storyName.toLowerCase()));
if (targetOpt) {
  console.log(`Selected: ${targetOpt.text}`);
  await page.selectOption('select#story-select', targetOpt.value);
  await page.waitForTimeout(2000);
  
  // Get total steps from indicator at bottom right showing "X / Y"
  let totalSteps = 6;
  const indicators = await page.$$('[class*="step"], [class*="indicator"]');
  for (const el of indicators) {
    const text = await el.textContent();
    const match = text?.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      totalSteps = parseInt(match[2]);
      break;
    }
  }
  // Also check page text directly
  const pageText = await page.textContent('body');
  const altMatch = pageText.match(/(\d+)\s*\/\s*(\d+)/);
  if (altMatch && parseInt(altMatch[2]) > totalSteps) {
    totalSteps = parseInt(altMatch[2]);
  }
  console.log(`Total steps detected: ${totalSteps}`);
  
  await page.screenshot({ path: `${outputPrefix}1.png` });
  console.log(`Saved: ${outputPrefix}1.png`);
  
  // Step through all steps
  for (let i = 2; i <= totalSteps; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outputPrefix}${i}.png` });
    console.log(`Saved: ${outputPrefix}${i}.png`);
  }
} else {
  console.log(`Could not find story matching: ${storyName}`);
  await page.screenshot({ path: 'screenshots/current-view.png' });
}

await browser.close();
