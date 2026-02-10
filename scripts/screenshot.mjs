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

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
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
  
  // Get step count from step indicator
  const stepText = await page.$eval('.step-indicator, [class*="step"]', el => el.textContent).catch(() => null);
  const totalSteps = stepText ? parseInt(stepText.match(/\d+\s*\/\s*(\d+)/)?.[1] || '6') : 6;
  console.log(`Total steps: ${totalSteps}`);
  
  await page.screenshot({ path: `${outputPrefix}1.png` });
  console.log(`Saved: ${outputPrefix}1.png`);
  
  // Step through with Next button
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
