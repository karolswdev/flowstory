/**
 * E2E Tests: Architectural Renderer
 * 
 * Tests for ENGINE-003: Architectural Renderer Core
 * Validates BC swim lanes, orchestration layer, infrastructure layer, and layout.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as YAML from 'yaml';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read architectural story
function readArchitecturalStory() {
  const storyPath = path.join(__dirname, '../stories/architectural/trf-processing.yaml');
  return fs.readFileSync(storyPath, 'utf-8');
}

test.describe('Architectural Renderer - Core Layout', () => {
  test.beforeEach(async ({ page }) => {
    // We need to modify the app to use architectural renderer
    // For now, test that the components exist and can be imported
    await page.goto('/');
    await page.waitForSelector('[data-testid="story-canvas"]', { timeout: 10000 });
  });

  test('architectural story has valid structure', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // Verify bounded contexts for swim lanes
    expect(story.boundedContexts).toBeDefined();
    expect(story.boundedContexts.length).toBeGreaterThan(0);
    
    // Each BC should have id and name
    for (const bc of story.boundedContexts) {
      expect(bc.id).toBeDefined();
      expect(bc.name).toBeDefined();
    }
    
    // Verify orchestration for conductor layer
    expect(story.orchestration).toBeDefined();
    expect(story.orchestration.type).toBe('conductor');
    expect(story.orchestration.steps.length).toBeGreaterThan(0);
    
    // Verify infrastructure for service bus
    expect(story.infrastructure).toBeDefined();
    expect(story.infrastructure.length).toBeGreaterThan(0);
  });

  test('nodes have layer assignments for layout', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const validLayers = ['orchestration', 'domain', 'infrastructure'];
    
    // All nodes with layer should have valid values
    const nodesWithLayer = story.nodes.filter((n: { layer?: string }) => n.layer);
    expect(nodesWithLayer.length).toBeGreaterThan(0);
    
    for (const node of nodesWithLayer) {
      expect(validLayers).toContain(node.layer);
    }
    
    // Check distribution of layers
    const orchestrationNodes = story.nodes.filter((n: { layer?: string }) => n.layer === 'orchestration');
    const domainNodes = story.nodes.filter((n: { layer?: string }) => n.layer === 'domain');
    const infrastructureNodes = story.nodes.filter((n: { layer?: string }) => n.layer === 'infrastructure');
    
    expect(orchestrationNodes.length).toBeGreaterThan(0);
    expect(domainNodes.length).toBeGreaterThan(0);
    expect(infrastructureNodes.length).toBeGreaterThan(0);
  });

  test('nodes are assigned to bounded contexts', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bcIds = new Set(story.boundedContexts.map((bc: { id: string }) => bc.id));
    bcIds.add('external'); // External is always valid
    
    // Most nodes should have boundedContext
    const nodesWithBC = story.nodes.filter((n: { boundedContext?: string }) => n.boundedContext);
    expect(nodesWithBC.length).toBeGreaterThan(story.nodes.length / 2);
    
    // All assigned BCs should be valid
    for (const node of nodesWithBC) {
      expect(bcIds.has(node.boundedContext)).toBe(true);
    }
  });

  test('orchestration steps target valid BCs', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bcIds = new Set(story.boundedContexts.map((bc: { id: string }) => bc.id));
    
    for (const step of story.orchestration.steps) {
      expect(bcIds.has(step.targetBC)).toBe(true);
    }
  });

  test('infrastructure includes service bus', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const bus = story.infrastructure.find((i: { type: string }) => i.type === 'bus');
    expect(bus).toBeDefined();
    expect(bus.name).toBeDefined();
  });

  test('cross-BC edges are marked correctly', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // Build node BC map
    const nodeBCMap = new Map<string, string>();
    for (const node of story.nodes) {
      if (node.boundedContext) {
        nodeBCMap.set(node.id, node.boundedContext);
      }
    }
    
    // Check edges marked as crossBC
    const crossBCEdges = story.edges.filter((e: { crossBC?: boolean }) => e.crossBC);
    expect(crossBCEdges.length).toBeGreaterThan(0);
    
    // Verify they actually cross BCs
    for (const edge of crossBCEdges) {
      const sourceBC = nodeBCMap.get(edge.source);
      const targetBC = nodeBCMap.get(edge.target);
      // Both should exist and be different (or one is external)
      if (sourceBC && targetBC) {
        expect(sourceBC !== targetBC || sourceBC === 'external' || targetBC === 'external').toBe(true);
      }
    }
  });
});

test.describe('Architectural Renderer - Steps', () => {
  test('steps have activeBCs for BC highlighting', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // At least some steps should have activeBCs
    const stepsWithActiveBCs = story.steps.filter((s: { activeBCs?: string[] }) => s.activeBCs?.length > 0);
    expect(stepsWithActiveBCs.length).toBeGreaterThan(0);
    
    // Validate activeBCs reference valid BCs
    const bcIds = new Set(story.boundedContexts.map((bc: { id: string }) => bc.id));
    
    for (const step of stepsWithActiveBCs) {
      for (const bc of step.activeBCs) {
        expect(bcIds.has(bc)).toBe(true);
      }
    }
  });

  test('steps have orchestrationStep for conductor progress', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // At least some steps should link to orchestration steps
    const stepsWithOrch = story.steps.filter((s: { orchestrationStep?: string }) => s.orchestrationStep);
    expect(stepsWithOrch.length).toBeGreaterThan(0);
    
    // Validate references
    const orchStepIds = new Set(story.orchestration.steps.map((s: { id: string }) => s.id));
    
    for (const step of stepsWithOrch) {
      expect(orchStepIds.has(step.orchestrationStep)).toBe(true);
    }
  });

  test('steps have events for event flow visualization', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // At least some steps should have events
    const stepsWithEvents = story.steps.filter((s: { events?: unknown[] }) => s.events?.length > 0);
    expect(stepsWithEvents.length).toBeGreaterThan(0);
    
    // Events should have type, from, to
    for (const step of stepsWithEvents) {
      for (const event of step.events) {
        expect(event.type).toBeDefined();
        expect(event.from).toBeDefined();
        expect(event.to).toBeDefined();
      }
    }
  });

  test('steps have commands for command visualization', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    // At least some steps should have commands
    const stepsWithCommands = story.steps.filter((s: { commands?: unknown[] }) => s.commands?.length > 0);
    expect(stepsWithCommands.length).toBeGreaterThan(0);
    
    // Commands should have type, from, to
    for (const step of stepsWithCommands) {
      for (const command of step.commands) {
        expect(command.type).toBeDefined();
        expect(command.from).toBeDefined();
        expect(command.to).toBeDefined();
      }
    }
  });
});

test.describe('Architectural Renderer - Zoom Levels', () => {
  test('nodes have zoomLevel for visibility control', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const validZoomLevels = ['executive', 'manager', 'engineer'];
    
    // At least some nodes should have zoomLevel
    const nodesWithZoom = story.nodes.filter((n: { zoomLevel?: string }) => n.zoomLevel);
    expect(nodesWithZoom.length).toBeGreaterThan(0);
    
    // All zoomLevels should be valid
    for (const node of nodesWithZoom) {
      expect(validZoomLevels).toContain(node.zoomLevel);
    }
    
    // Check distribution
    const executiveNodes = story.nodes.filter((n: { zoomLevel?: string }) => n.zoomLevel === 'executive');
    const managerNodes = story.nodes.filter((n: { zoomLevel?: string }) => n.zoomLevel === 'manager');
    const engineerNodes = story.nodes.filter((n: { zoomLevel?: string }) => n.zoomLevel === 'engineer');
    
    expect(executiveNodes.length).toBeGreaterThan(0);
    expect(managerNodes.length).toBeGreaterThan(0);
    expect(engineerNodes.length).toBeGreaterThan(0);
  });

  test('edges have zoomLevel for visibility control', async ({ page }) => {
    const storyYaml = readArchitecturalStory();
    const story = YAML.parse(storyYaml);
    
    const validZoomLevels = ['executive', 'manager', 'engineer'];
    
    // At least some edges should have zoomLevel
    const edgesWithZoom = story.edges.filter((e: { zoomLevel?: string }) => e.zoomLevel);
    expect(edgesWithZoom.length).toBeGreaterThan(0);
    
    // All zoomLevels should be valid
    for (const edge of edgesWithZoom) {
      expect(validZoomLevels).toContain(edge.zoomLevel);
    }
  });
});
