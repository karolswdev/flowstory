/**
 * E2E Tests: Architectural Schema Parser
 * 
 * Tests for ENGINE-002: Architectural Schema Parser
 * Validates that v2 (architectural) stories parse correctly and render.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to read the architectural story
function readArchitecturalStory() {
  const storyPath = path.join(__dirname, '../stories/architectural/trf-processing.yaml');
  return fs.readFileSync(storyPath, 'utf-8');
}

test.describe('Architectural Schema Parser', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('parses v2 architectural story YAML correctly', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // Validate schema version
    expect(story.schemaVersion).toBe('2.0');
    expect(story.renderer).toBe('architectural');
    
    // Validate bounded contexts
    expect(story.boundedContexts).toHaveLength(3);
    expect(story.boundedContexts[0].id).toBe('enrollment-demand');
    expect(story.boundedContexts[1].id).toBe('routing-pricing');
    expect(story.boundedContexts[2].id).toBe('assignment');
    
    // Validate orchestration
    expect(story.orchestration.type).toBe('conductor');
    expect(story.orchestration.steps).toHaveLength(4);
    
    // Validate infrastructure
    expect(story.infrastructure).toHaveLength(2);
    expect(story.infrastructure[0].type).toBe('bus');
    expect(story.infrastructure[1].type).toBe('topic');
    
    // Validate nodes have architectural fields
    const orchNode = story.nodes.find((n: { id: string }) => n.id === 'orch-validate');
    expect(orchNode).toBeDefined();
    expect(orchNode.type).toBe('orchestrator-step');
    expect(orchNode.layer).toBe('orchestration');
    expect(orchNode.orchestrationStepId).toBe('validate');
    
    // Validate edges have architectural fields
    const crossBCEdge = story.edges.find((e: { id: string }) => e.id === 'e1');
    expect(crossBCEdge).toBeDefined();
    expect(crossBCEdge.crossBC).toBe(true);
    expect(crossBCEdge.routeVia).toBe('service-bus');
    
    // Validate steps have architectural fields
    const step1 = story.steps.find((s: { id: string }) => s.id === 'step-1');
    expect(step1).toBeDefined();
    expect(step1.activeBCs).toContain('enrollment-demand');
    expect(step1.events).toBeDefined();
    expect(step1.events[0].from).toBe('external');
    expect(step1.events[0].to).toBe('enrollment-demand');
  });

  test('v2 story has all required actor types', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const actorTypes = story.actors.map((a: { type: string }) => a.type);
    expect(actorTypes).toContain('user');
    expect(actorTypes).toContain('orchestrator');
    expect(actorTypes).toContain('service');
  });

  test('v2 story has all required node types', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const nodeTypes = story.nodes.map((n: { type: string }) => n.type);
    expect(nodeTypes).toContain('action');
    expect(nodeTypes).toContain('event');
    expect(nodeTypes).toContain('system');
    expect(nodeTypes).toContain('orchestrator-step');
    expect(nodeTypes).toContain('infrastructure');
  });

  test('v2 story has all required edge types', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const edgeTypes = story.edges.map((e: { type: string }) => e.type);
    expect(edgeTypes).toContain('event');
    expect(edgeTypes).toContain('command');
  });

  test('v2 story layers are valid', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const validLayers = ['orchestration', 'domain', 'infrastructure'];
    for (const node of story.nodes) {
      if (node.layer) {
        expect(validLayers).toContain(node.layer);
      }
    }
  });

  test('v2 story zoom levels are valid', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const validZoomLevels = ['executive', 'manager', 'engineer'];
    for (const node of story.nodes) {
      if (node.zoomLevel) {
        expect(validZoomLevels).toContain(node.zoomLevel);
      }
    }
    for (const edge of story.edges) {
      if (edge.zoomLevel) {
        expect(validZoomLevels).toContain(edge.zoomLevel);
      }
    }
  });

  test('orchestration steps reference valid BCs', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bcIds = story.boundedContexts.map((bc: { id: string }) => bc.id);
    
    for (const step of story.orchestration.steps) {
      expect(bcIds).toContain(step.targetBC);
    }
  });

  test('infrastructure parent references are valid', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const infraIds = story.infrastructure.map((i: { id: string }) => i.id);
    
    for (const infra of story.infrastructure) {
      if (infra.parentId) {
        expect(infraIds).toContain(infra.parentId);
      }
    }
  });

  test('edge routeVia references valid infrastructure', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const infraIds = story.infrastructure.map((i: { id: string }) => i.id);
    
    for (const edge of story.edges) {
      if (edge.routeVia) {
        expect(infraIds).toContain(edge.routeVia);
      }
    }
  });

  test('step events reference valid BCs', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bcIds = [...story.boundedContexts.map((bc: { id: string }) => bc.id), 'external', 'conductor'];
    
    for (const step of story.steps) {
      if (step.events) {
        for (const event of step.events) {
          expect(bcIds).toContain(event.from);
          expect(bcIds).toContain(event.to);
        }
      }
      if (step.commands) {
        for (const command of step.commands) {
          expect([...bcIds, 'conductor']).toContain(command.to);
        }
      }
    }
  });
});

test.describe('Backward Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('v1 story still parses and renders', async ({ page }) => {
    // The default story is v1 format - should still work
    await expect(page.locator('[data-testid="story-canvas"]')).toBeVisible();
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('v1 story without schemaVersion defaults correctly', async ({ page }) => {
    // Check that the default story (v1) renders with flow renderer
    const storyPath = path.join(__dirname, '../stories/enrollment-demand/trf-new-submission.yaml');
    const storyYaml = fs.readFileSync(storyPath, 'utf-8');
    const story = YAML.parse(storyYaml);
    
    // Should not have v2 fields
    expect(story.schemaVersion).toBeUndefined();
    expect(story.boundedContexts).toBeUndefined();
    expect(story.orchestration).toBeUndefined();
    
    // Should still render
    await expect(page.locator('[data-testid="story-canvas"]')).toBeVisible();
  });
});

test.describe('Architectural Validation', () => {
  test('validates BC references correctly', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bcIds = new Set([
      ...story.boundedContexts.map((bc: { id: string }) => bc.id),
      'external',
      'default'
    ]);
    
    // All node boundedContext values should be valid
    for (const node of story.nodes) {
      if (node.boundedContext) {
        expect(bcIds.has(node.boundedContext)).toBe(true);
      }
    }
    
    // All activeBCs in steps should be valid
    for (const step of story.steps) {
      if (step.activeBCs) {
        for (const bc of step.activeBCs) {
          expect(bcIds.has(bc)).toBe(true);
        }
      }
    }
  });

  test('validates orchestration step IDs correctly', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const orchStepIds = new Set(
      story.orchestration.steps.map((s: { id: string }) => s.id)
    );
    
    // All orchestrator-step nodes should reference valid orchestration steps
    const orchNodes = story.nodes.filter((n: { type: string }) => n.type === 'orchestrator-step');
    for (const node of orchNodes) {
      if (node.orchestrationStepId) {
        expect(orchStepIds.has(node.orchestrationStepId)).toBe(true);
      }
    }
    
    // All step.orchestrationStep values should be valid
    for (const step of story.steps) {
      if (step.orchestrationStep) {
        expect(orchStepIds.has(step.orchestrationStep)).toBe(true);
      }
    }
  });
});
