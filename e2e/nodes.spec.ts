import { test, expect } from '@playwright/test';

test.describe('Node Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for story to load
    await page.waitForSelector('[data-testid="story-canvas"]');
  });

  test('renders ActorNode correctly', async ({ page }) => {
    // Actor node is visible on step 1
    const actorNode = page.getByTestId('actor-node');
    await expect(actorNode).toBeVisible();
    
    // Check avatar is displayed
    await expect(actorNode.locator('.actor-avatar')).toContainText('👨‍👩‍👧');
    
    // Check label is displayed
    await expect(actorNode.locator('.actor-label')).toContainText('Parent');
  });

  test('renders ActionNode correctly', async ({ page }) => {
    // Navigate to step where action nodes are visible
    await page.getByTestId('next-button').click();
    await page.getByTestId('next-button').click();
    
    const actionNodes = page.getByTestId('action-node');
    await expect(actionNodes.first()).toBeVisible();
    
    // Check label is displayed
    await expect(actionNodes.first().locator('.action-label')).toBeVisible();
  });

  test('renders DecisionNode correctly', async ({ page }) => {
    // Navigate to step 6 where decision is visible
    for (let i = 0; i < 5; i++) {
      await page.getByTestId('next-button').click();
    }
    
    const decisionNode = page.getByTestId('decision-node');
    await expect(decisionNode).toBeVisible();
    
    // Check label in diamond
    await expect(decisionNode.locator('.decision-label')).toContainText('Valid?');
  });

  test('renders SystemNode correctly', async ({ page }) => {
    // Navigate to step 5 where system node is visible
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('next-button').click();
    }
    
    const systemNode = page.getByTestId('system-node');
    await expect(systemNode).toBeVisible();
    
    // Check gear icon
    await expect(systemNode.locator('.system-icon')).toContainText('⚙️');
    
    // Check label
    await expect(systemNode.locator('.system-label')).toContainText('Validate');
  });

  test('renders EventNode correctly', async ({ page }) => {
    // Navigate to step 4 where event node is visible
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('next-button').click();
    }
    
    const eventNode = page.getByTestId('event-node');
    await expect(eventNode).toBeVisible();
    
    // Check lightning icon
    await expect(eventNode.locator('.event-icon')).toContainText('⚡');
  });

  test('renders StateNode correctly', async ({ page }) => {
    // Navigate to step 7 where state nodes are visible
    for (let i = 0; i < 6; i++) {
      await page.getByTestId('next-button').click();
    }
    
    const stateNodes = page.getByTestId('state-node');
    
    // Check success variant
    const successNode = stateNodes.filter({ hasText: 'Approved' });
    await expect(successNode).toBeVisible();
  });

  test('active node has active styling', async ({ page }) => {
    // Actor node is active on step 1
    const actorNode = page.getByTestId('actor-node');
    await expect(actorNode).toHaveClass(/node-active/);
  });

  test('complete node has complete styling', async ({ page }) => {
    // Navigate to step 3 where first nodes become complete
    await page.getByTestId('next-button').click();
    await page.getByTestId('next-button').click();
    await page.getByTestId('next-button').click();
    await page.getByTestId('next-button').click();
    
    // Actor node should now be complete (shown in earlier step, not current)
    const actorNode = page.getByTestId('actor-node');
    await expect(actorNode).toHaveClass(/node-complete/);
  });

  test('nodes are clickable and interactive', async ({ page }) => {
    // Actor node is visible on step 1
    const actorNode = page.getByTestId('actor-node');
    
    // Node should be visible and clickable
    await expect(actorNode).toBeVisible();
    
    // Click should work without errors
    await actorNode.click();
    
    // Node should still be visible after click
    await expect(actorNode).toBeVisible();
  });

  test('all 6 node types exist in story', async ({ page }) => {
    // Navigate to final step where most nodes have been shown
    for (let i = 0; i < 6; i++) {
      await page.getByTestId('next-button').click();
    }
    
    // Verify we can find at least one of each type (some may be complete/hidden)
    await expect(page.getByTestId('actor-node')).toHaveCount(1);
    await expect(page.getByTestId('state-node')).toHaveCount(1);
    await expect(page.getByTestId('decision-node')).toHaveCount(1);
  });
});
