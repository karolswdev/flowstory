#!/usr/bin/env npx tsx
/**
 * Story Migration Script
 * 
 * Converts old absolute-position stories to camera-centric format.
 * 
 * Usage: npx tsx scripts/migrate-story.ts <story.yaml>
 */

import * as fs from 'fs';
import * as yaml from 'yaml';

interface OldNode {
  id: string;
  position: { x: number; y: number };
  [key: string]: unknown;
}

interface OldStory {
  nodes: OldNode[];
  [key: string]: unknown;
}

interface NewStory {
  camera: {
    center: [number, number];
    zoom: number;
  };
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function migrateStory(input: OldStory): NewStory {
  const nodes = input.nodes || [];
  
  if (nodes.length === 0) {
    return {
      ...input,
      camera: { center: [0, 0], zoom: 1.0 },
    } as NewStory;
  }

  // Calculate center of all nodes
  const sumX = nodes.reduce((sum, n) => sum + (n.position?.x || 0), 0);
  const sumY = nodes.reduce((sum, n) => sum + (n.position?.y || 0), 0);
  const centerX = Math.round(sumX / nodes.length);
  const centerY = Math.round(sumY / nodes.length);

  // Convert positions to relative (offset from center)
  const migratedNodes = nodes.map(node => ({
    ...node,
    position: {
      x: Math.round((node.position?.x || 0) - centerX),
      y: Math.round((node.position?.y || 0) - centerY),
    },
  }));

  // Calculate zoom based on spread
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const node of migratedNodes) {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
  }
  
  const spread = Math.max(maxX - minX, maxY - minY);
  // Default viewport is ~800px, so if spread > 600, zoom out
  const zoom = spread > 600 ? Math.round((600 / spread) * 10) / 10 : 1.0;

  return {
    ...input,
    camera: {
      center: [0, 0],  // Center is now origin
      zoom,
    },
    nodes: migratedNodes,
  } as NewStory;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/migrate-story.ts <story.yaml>');
    console.log('       npx tsx scripts/migrate-story.ts --all');
    process.exit(1);
  }

  if (args[0] === '--all') {
    // Migrate all stories
    const storyDirs = [
      'stories',
    ];
    
    for (const dir of storyDirs) {
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = fs.readdirSync(`${dir}/${file.name}`);
          for (const subFile of subFiles) {
            if (subFile.endsWith('.yaml') || subFile.endsWith('.yml')) {
              migrateFile(`${dir}/${file.name}/${subFile}`);
            }
          }
        } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          migrateFile(`${dir}/${file.name}`);
        }
      }
    }
  } else {
    migrateFile(args[0]);
  }
}

function migrateFile(filepath: string) {
  console.log(`Migrating: ${filepath}`);
  
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const story = yaml.parse(content) as OldStory;
    
    // Skip if already has camera
    if ('camera' in story) {
      console.log(`  ⏭️  Already migrated (has camera section)`);
      return;
    }
    
    const migrated = migrateStory(story);
    
    // Write back with preserved formatting
    const output = yaml.stringify(migrated, {
      indent: 2,
      lineWidth: 0,  // Don't wrap lines
    });
    
    fs.writeFileSync(filepath, output);
    console.log(`  ✅ Migrated (center offset applied, zoom: ${migrated.camera.zoom})`);
  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
  }
}

main();
