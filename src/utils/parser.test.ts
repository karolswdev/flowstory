import { describe, it, expect } from 'vitest';
import { parseStory } from './parser';

describe('parseStory', () => {
  const validStory = `
id: test-story
title: Test Story
description: A test story
boundedContext: test-context
version: "1.0"

actors:
  - id: user1
    name: Test User
    type: user

nodes:
  - id: node1
    type: action
    label: Test Action
    position: { x: 100, y: 100 }

edges:
  - id: edge1
    source: node1
    target: node1
    type: flow

steps:
  - id: step1
    order: 1
    nodeIds: [node1]
    edgeIds: []
    narrative: Test narrative
`;

  it('parses valid YAML story', () => {
    const { story, validation } = parseStory(validStory);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(story).not.toBeNull();
    expect(story?.id).toBe('test-story');
    expect(story?.title).toBe('Test Story');
  });

  it('parses valid JSON story', () => {
    const jsonStory = JSON.stringify({
      id: 'json-story',
      title: 'JSON Story',
      description: 'A JSON story',
      boundedContext: 'test',
      version: '1.0',
      actors: [{ id: 'a1', name: 'Actor', type: 'user' }],
      nodes: [{ id: 'n1', type: 'action', label: 'Node', position: { x: 0, y: 0 } }],
      edges: [{ id: 'e1', source: 'n1', target: 'n1', type: 'flow' }],
      steps: [{ id: 's1', order: 1, nodeIds: ['n1'], edgeIds: [], narrative: 'Test' }],
    });

    const { story, validation } = parseStory(jsonStory);
    
    expect(validation.valid).toBe(true);
    expect(story?.id).toBe('json-story');
  });

  it('returns error for invalid YAML', () => {
    const { story, validation } = parseStory('{{invalid yaml');
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(story).toBeNull();
  });

  it('returns error for missing required fields', () => {
    const { story, validation } = parseStory('id: incomplete');
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.path === 'title')).toBe(true);
    expect(story).toBeNull();
  });

  it('validates actor types', () => {
    const invalidActor = `
id: test
title: Test
description: Test
boundedContext: test
version: "1.0"
actors:
  - id: a1
    name: Actor
    type: invalid
nodes: []
edges: []
steps: []
`;
    const { validation } = parseStory(invalidActor);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.message.includes('Actor type must be one of'))).toBe(true);
  });

  it('validates node types', () => {
    const invalidNode = `
id: test
title: Test
description: Test
boundedContext: test
version: "1.0"
actors: []
nodes:
  - id: n1
    type: invalid
    label: Node
    position: { x: 0, y: 0 }
edges: []
steps: []
`;
    const { validation } = parseStory(invalidNode);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.message.includes('Node type must be'))).toBe(true);
  });

  it('validates edge source/target exist', () => {
    const invalidEdge = `
id: test
title: Test
description: Test
boundedContext: test
version: "1.0"
actors: []
nodes:
  - id: n1
    type: action
    label: Node
    position: { x: 0, y: 0 }
edges:
  - id: e1
    source: n1
    target: nonexistent
    type: flow
steps: []
`;
    const { validation } = parseStory(invalidEdge);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.message.includes('not found in nodes'))).toBe(true);
  });

  it('validates steps have narrative and activeNodes', () => {
    const invalidStep = `
id: test
title: Test
description: Test
boundedContext: test
version: "1.0"
actors: []
nodes: []
edges: []
steps:
  - id: s1
`;
    const { validation } = parseStory(invalidStep);
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.message.includes('narrative') || e.message.includes('nodeIds'))).toBe(true);
  });
});
