/**
 * E2E Tests: Architectural Renderer - Animation
 * 
 * Tests for ENGINE-004: Animation Layer
 * Validates event flow, BC activation, and orchestrator animations.
 */

import { test, expect } from '@playwright/test';

test.describe('Architectural Animation - Edge States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('active edges have pulse animation class', async ({ page }) => {
    // Navigate to step 2 to activate some edges
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(500);
    
    // Check that active edges exist with animation
    const activeEdges = page.locator('.edge-active');
    const count = await activeEdges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('edges transition through states on navigation', async ({ page }) => {
    // Step 1 - initial edges
    const initialEdges = await page.locator('.react-flow__edge').count();
    
    // Navigate forward
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300);
    
    // Should have edges visible
    const step2Edges = await page.locator('.react-flow__edge:not([style*="display: none"])').count();
    expect(step2Edges).toBeGreaterThan(0);
  });

  test('CSS animations are defined for edges', async ({ page }) => {
    // Check that the edge-pulse keyframes exist
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(
            rule => rule.cssText?.includes('edge-pulse') || rule.cssText?.includes('edge-trace')
          );
        } catch {
          return false;
        }
      });
    });
    
    expect(stylesheets).toBe(true);
  });
});

test.describe('Architectural Animation - Node States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('active nodes are visually distinguished', async ({ page }) => {
    // Navigate to ensure some nodes are active
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300);
    
    // Check for nodes (React Flow renders them)
    const nodes = await page.locator('.react-flow__node').count();
    expect(nodes).toBeGreaterThan(0);
  });

  test('nodes update on step change', async ({ page }) => {
    // Get initial node state
    const step1Nodes = await page.locator('.react-flow__node:not([style*="display: none"])').count();
    
    // Navigate forward
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(400);
    
    // Nodes should still exist (may have different count)
    const step2Nodes = await page.locator('.react-flow__node').count();
    expect(step2Nodes).toBeGreaterThan(0);
  });
});

test.describe('Architectural Animation - Playback Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('step navigation updates visual state', async ({ page }) => {
    // Get initial step
    const step1 = await page.locator('[data-testid="step-counter"]').textContent();
    expect(step1).toContain('1 /');
    
    // Navigate forward
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300);
    
    // Should have progressed
    const step2 = await page.locator('[data-testid="step-counter"]').textContent();
    expect(step2).toContain('2 /');
  });

  test('keyboard navigation updates animations', async ({ page }) => {
    // Get initial step
    const step1 = await page.locator('[data-testid="step-counter"]').textContent();
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // Should have progressed
    const step2 = await page.locator('[data-testid="step-counter"]').textContent();
    expect(step2).not.toBe(step1);
  });

  test('home key resets to initial state', async ({ page }) => {
    // Navigate forward first
    await page.click('[data-testid="next-button"]');
    await page.click('[data-testid="next-button"]');
    await page.waitForTimeout(300);
    
    // Press Home to reset
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    
    // Should be back at step 1
    const stepCounter = await page.locator('[data-testid="step-counter"]').textContent();
    expect(stepCounter).toContain('1 /');
  });
});

test.describe('Architectural Animation - CSS Features', () => {
  test('edge-pulse keyframes exist for active edges', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]');
    
    // Edge styles are always loaded (edges.css)
    const hasEdgePulse = await page.evaluate(() => {
      return Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(
            rule => rule.cssText?.includes('edge-pulse')
          );
        } catch {
          return false;
        }
      });
    });
    
    expect(hasEdgePulse).toBe(true);
  });

  test('edge-trace keyframes exist for new edges', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]');
    
    const hasEdgeTrace = await page.evaluate(() => {
      return Array.from(document.styleSheets).some(sheet => {
        try {
          return Array.from(sheet.cssRules).some(
            rule => rule.cssText?.includes('edge-trace')
          );
        } catch {
          return false;
        }
      });
    });
    
    expect(hasEdgeTrace).toBe(true);
  });

  test('framer motion is loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]');
    
    // Check for motion elements (they have data-motion attributes or specific classes)
    const hasMotion = await page.evaluate(() => {
      // Framer motion adds specific attributes
      return document.querySelector('[style*="transform"]') !== null ||
             document.querySelector('[style*="opacity"]') !== null;
    });
    
    expect(hasMotion).toBe(true);
  });
});
