import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  const text = msg.text();
  if (text.includes('Error') || text.includes('[FlowStory]')) {
    console.log('CONSOLE:', text);
  }
});
page.on('pageerror', err => console.log('ERROR:', err.message));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const options = await page.$$eval('select#story-select option', opts => 
  opts.map(o => o.textContent)
);
console.log('Stories found:', options.length);
if (options.length > 0) {
  console.log('First 5:', options.slice(0, 5));
}

await browser.close();
