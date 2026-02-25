/**
 * Dynamic Story Catalog — auto-discovers all YAML stories at build time.
 *
 * Uses Vite's `import.meta.glob` to load every `stories/**\/*.yaml` as a raw
 * string, parses the YAML header for metadata, and builds the catalog that
 * App.tsx consumes. Zero manual registration required.
 */
import YAML from 'yaml';

// ── Glob import: all YAML files under stories/, eager, as raw strings ──

const storyModules = import.meta.glob<string>(
  '/stories/**/*.yaml',
  { query: '?raw', import: 'default', eager: true },
);

// ── Types ──

export interface StoryCatalogEntry {
  title: string;
  category: string;
  description?: string;
  renderer?: string;
}

// ── Category mapping from directory path ──

const DIR_CATEGORY_MAP: Record<string, string> = {
  'service': 'Service Flows',
  'catalyst': 'Catalyst',
  'composite': 'Composite',
  'pipeline': 'Pipelines',
  'user-journeys': 'User Journeys',
  'http': 'HTTP Flows',
  'bc-deployment': 'BC Deployments',
  'bc-composition': 'BC Composition',
  'c4-context': 'Architecture',
  'tech-radar': 'Strategy',
  'event-storming': 'DDD',
  'adr-timeline': 'Governance',
  'cloud-cost': 'FinOps',
  'pitch': 'Pitch',
  'state-diagram': 'State Diagrams',
  'dependency-graph': 'Dependency Graphs',
  'migration-roadmap': 'Migration',
  'team-ownership': 'Team Ownership',
  'effects': 'Effects',
};

function categoryFromPath(filePath: string): string {
  // filePath looks like "/stories/service/order-processing.yaml"
  const segments = filePath.replace(/^\/stories\//, '').split('/');
  if (segments.length > 1) {
    const dir = segments[0];
    return DIR_CATEGORY_MAP[dir] ?? dir.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'General';
}

function storyIdFromPath(filePath: string): string {
  // "/stories/service/order-processing.yaml" → "order-processing"
  const filename = filePath.split('/').pop() ?? '';
  return filename.replace(/\.yaml$/, '');
}

// ── Build catalog ──

const catalog: Record<string, StoryCatalogEntry> = {};
const contentMap: Record<string, string> = {};

for (const [filePath, raw] of Object.entries(storyModules)) {
  // Skip _archive directories
  if (filePath.includes('/_archive/')) continue;

  // Parse just enough of the YAML to get the header
  let header: Record<string, unknown>;
  try {
    header = YAML.parse(raw);
    if (!header || typeof header !== 'object') continue;
  } catch {
    continue;
  }

  const title = header.title as string | undefined;
  if (!title) continue; // Skip files without a title

  const yamlId = header.id as string | undefined;
  const storyId = yamlId || storyIdFromPath(filePath);
  const category = (header.category as string | undefined) ?? categoryFromPath(filePath);
  const renderer = (header.renderer ?? header.type) as string | undefined;
  const description = header.description as string | undefined;

  catalog[storyId] = { title, category, description, renderer };
  contentMap[storyId] = raw;
}

// ── Sort entries within each category alphabetically by title ──

const sortedEntries = Object.entries(catalog).sort(([, a], [, b]) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.title.localeCompare(b.title);
});

export const STORY_CATALOG: Record<string, StoryCatalogEntry> = Object.fromEntries(sortedEntries);

/**
 * Get the raw YAML content for a story. Synchronous — no fetch needed.
 * Returns undefined if the story ID is not found.
 */
export function getStoryContent(storyId: string): string | undefined {
  return contentMap[storyId];
}

/**
 * Get the first available story ID (for default selection).
 */
export function getDefaultStoryId(): string {
  return Object.keys(STORY_CATALOG)[0] ?? 'user-registration';
}
