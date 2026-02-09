import { test, expect } from '@playwright/test';

test.describe('Node & Edge Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await page.waitForSelector('[data-testid="story-canvas"]');
  });

  test('active node has animation state attribute', async ({ page }) => {
    // Actor node is active on step 1
    const actorNode = page.getByTestId('actor-node');
    await expect(actorNode).toHaveAttribute('data-animation-state', 'active');
  });

  test('node animation state changes on step navigation', async ({ page }) => {
    const actorNode = page.getByTestId('actor-node');

    // Initially active
    await expect(actorNode).toHaveAttribute('data-animation-state', 'active');

    // Navigate to step where actor becomes complete
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('next-button').click();
    }

    // Now should be complete (inactive in variants)
    await expect(actorNode).toHaveAttribute('data-animation-state', 'complete');
  });

  test('newly visible node starts with active state', async ({ page }) => {
    // Navigate to step 2 to see action node appear
    await page.getByTestId('next-button').click();

    const actionNode = page.getByTestId('action-node').first();
    await expect(actionNode).toHaveAttribute('data-animation-state', 'active');
  });

  test('active node has pulse animation via CSS class', async ({ page }) => {
    const actorNode = page.getByTestId('actor-node');

    // Should have node-active class which triggers CSS animation
    await expect(actorNode).toHaveClass(/node-active/);
  });

  test('complete node loses active animation', async ({ page }) => {
    const actorNode = page.getByTestId('actor-node');

    // Initially has node-active
    await expect(actorNode).toHaveClass(/node-active/);

    // Navigate to step where actor becomes complete
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('next-button').click();
    }

    // Should now have node-complete instead
    await expect(actorNode).toHaveClass(/node-complete/);
    await expect(actorNode).not.toHaveClass(/node-active/);
  });

  test('active edge has edge-active class', async ({ page }) => {
    // Navigate to step 2 where first edge is active
    await page.getByTestId('next-button').click();

    const flowEdge = page.getByTestId('flow-edge').first();
    await expect(flowEdge).toHaveClass(/edge-active/);
  });

  test('animations complete without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through all steps to trigger all animations
    for (let i = 0; i < 6; i++) {
      await page.getByTestId('next-button').click();
      // Small wait for animations
      await page.waitForTimeout(100);
    }

    // Filter React dev warnings
    const realErrors = errors.filter(
      (e) => !e.includes('React DevTools') && !e.includes('Download the React DevTools')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('all node types support animation states', async ({ page }) => {
    // Navigate to final step to see all node types
    for (let i = 0; i < 6; i++) {
      await page.getByTestId('next-button').click();
    }

    // Check various node types have animation-state attribute
    await expect(page.getByTestId('actor-node')).toHaveAttribute('data-animation-state');
    await expect(page.getByTestId('decision-node')).toHaveAttribute('data-animation-state');
    await expect(page.getByTestId('state-node')).toHaveAttribute('data-animation-state');
  });

  test('step transitions show visual change', async ({ page }) => {
    // Get initial step counter
    const counter = page.getByTestId('step-counter');
    await expect(counter).toContainText('1 /');

    // Navigate and verify visual state changes
    await page.getByTestId('next-button').click();
    await expect(counter).toContainText('2 /');

    // New node should be visible
    await expect(page.getByTestId('action-node')).toBeVisible();
  });
});
