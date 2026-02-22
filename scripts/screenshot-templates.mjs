#!/usr/bin/env node
/**
 * Screenshot all specialized renderer templates for visual QA
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TEMPLATES = [
  { id: 'pipeline-deploy', name: 'CI/CD Deploy', steps: 5 },
  { id: 'http-user-creation', name: 'HTTP User Creation', steps: 3 },
  { id: 'service-order-processing', name: 'Service Order Processing', steps: 5 },
  { id: 'adr-timeline', name: 'ADR Timeline', steps: 7 },
  { id: 'c4-ecommerce', name: 'C4 Context', steps: 6 },
  { id: 'cloud-cost', name: 'Cloud Cost', steps: 7 },
  { id: 'dependency-graph', name: 'Dependency Graph', steps: 8 },
  { id: 'event-storming', name: 'Event Storming', steps: 8 },
  { id: 'migration-roadmap', name: 'Migration Roadmap', steps: 8 },
  { id: 'team-ownership', name: 'Team Ownership', steps: 6 },
  { id: 'tech-radar', name: 'Tech Radar', steps: 6 },
];

const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = './screenshots/qa';

async function run() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  for (const template of TEMPLATES) {
    console.log(`📸 ${template.name}...`);
    
    try {
      await page.goto(`${BASE_URL}/?story=${template.id}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // Let animations settle
      
      // Take initial screenshot
      const filename = `${template.id}-step1.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
      console.log(`  ✓ ${filename}`);
      
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }
  
  await browser.close();
  console.log(`\n✅ Screenshots saved to ${OUTPUT_DIR}`);
}

run().catch(console.error);
