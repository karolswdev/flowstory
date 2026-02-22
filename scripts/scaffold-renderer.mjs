#!/usr/bin/env node
/**
 * Renderer Scaffold Script
 * 
 * Creates boilerplate for a new FlowStory renderer.
 * 
 * Usage:
 *   npm run scaffold:renderer <renderer-name>
 *   node scripts/scaffold-renderer.mjs my-renderer
 * 
 * Creates:
 *   src/components/<renderer-name>/
 *     <RendererName>Canvas.tsx
 *     <renderer-name>.css
 *     index.ts
 *   src/schemas/<renderer-name>.ts
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Convert kebab-case to PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// Generate Canvas component
function generateCanvas(name) {
  const pascal = toPascalCase(name);
  return `import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import type { ${pascal}Story, ${pascal}Step } from '../../schemas/${name}';
import './${name}.css';

interface ${pascal}CanvasProps {
  story: ${pascal}Story;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

export function ${pascal}Canvas({
  story,
  currentStepIndex,
  onStepChange,
}: ${pascal}CanvasProps): JSX.Element {
  const currentStep = story.steps[currentStepIndex];

  // Compute visible/highlighted elements based on step
  const visibleElements = useMemo(() => {
    if (!currentStep?.activeElements) return story.elements;
    return story.elements.filter(el => currentStep.activeElements?.includes(el.id));
  }, [story.elements, currentStep]);

  return (
    <div className="${name}-canvas">
      {/* Main visualization */}
      <svg className="${name}-svg" viewBox="0 0 800 600">
        <AnimatePresence>
          {visibleElements.map((element, i) => (
            <motion.g
              key={element.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* TODO: Render element based on type */}
              <rect
                x={100 + i * 120}
                y={250}
                width={100}
                height={60}
                rx={8}
                fill="var(--color-bg-elevated)"
                stroke="var(--color-border)"
              />
              <text
                x={150 + i * 120}
                y={285}
                textAnchor="middle"
                fill="var(--color-text)"
                fontSize="12"
              >
                {element.name}
              </text>
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      {/* Info panel */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            className="${name}-info"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={TRANSITION.default}
            key={currentStepIndex}
          >
            <h3>{currentStep.title}</h3>
            <p>{currentStep.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="${name}-nav">
        <button
          onClick={() => onStepChange?.(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          ← Previous
        </button>
        <span>{currentStepIndex + 1} / {story.steps.length}</span>
        <button
          onClick={() => onStepChange?.(Math.min(story.steps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex >= story.steps.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default ${pascal}Canvas;
`;
}

// Generate CSS
function generateCSS(name) {
  return `/**
 * ${toPascalCase(name)} Canvas Styles
 * 
 * Uses design tokens from styles/tokens.css
 * Uses shared patterns from styles/canvas-common.css
 */

/* Canvas container */
.${name}-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  overflow: auto;
}

/* SVG viewport */
.${name}-svg {
  width: 100%;
  height: calc(100vh - 200px);
}

/* Info panel */
.${name}-info {
  position: absolute;
  bottom: calc(var(--space-16) + var(--space-6));
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-elevated);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.${name}-info h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  color: var(--color-text);
}

.${name}-info p {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--color-text-secondary);
}

/* Navigation */
.${name}-nav {
  position: absolute;
  bottom: var(--space-5);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-elevated);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.${name}-nav button {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  cursor: pointer;
}

.${name}-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.${name}-nav span {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}
`;
}

// Generate index.ts
function generateIndex(name) {
  const pascal = toPascalCase(name);
  return `export { ${pascal}Canvas, default } from './${pascal}Canvas';
`;
}

// Generate schema
function generateSchema(name) {
  const pascal = toPascalCase(name);
  return `/**
 * ${pascal} Schema
 * 
 * Defines the data structure for ${name} stories.
 */

import { z } from 'zod';

// ============================================
// Element Schema
// ============================================

export const ${pascal}ElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  // Add element-specific fields here
});

export type ${pascal}Element = z.infer<typeof ${pascal}ElementSchema>;

// ============================================
// Step Schema
// ============================================

export const ${pascal}StepSchema = z.object({
  title: z.string(),
  description: z.string(),
  activeElements: z.array(z.string()).optional(),
  // Add step-specific fields here
});

export type ${pascal}Step = z.infer<typeof ${pascal}StepSchema>;

// ============================================
// Story Schema
// ============================================

export const ${pascal}StorySchema = z.object({
  title: z.string(),
  type: z.literal('${name}'),
  version: z.number().default(1),
  elements: z.array(${pascal}ElementSchema),
  steps: z.array(${pascal}StepSchema),
});

export type ${pascal}Story = z.infer<typeof ${pascal}StorySchema>;
`;
}

// Main function
async function main() {
  const name = process.argv[2];
  
  if (!name) {
    console.error('Usage: npm run scaffold:renderer <renderer-name>');
    console.error('Example: npm run scaffold:renderer cost-analysis');
    process.exit(1);
  }
  
  // Validate name format
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Error: Renderer name must be kebab-case (e.g., my-renderer)');
    process.exit(1);
  }
  
  const pascal = toPascalCase(name);
  const componentDir = join(ROOT, 'src', 'components', name);
  const schemaPath = join(ROOT, 'src', 'schemas', `${name}.ts`);
  
  // Check if already exists
  if (existsSync(componentDir)) {
    console.error(`Error: Component directory already exists: ${componentDir}`);
    process.exit(1);
  }
  
  console.log(`\n🚀 Scaffolding renderer: ${name}\n`);
  
  // Create component directory
  await mkdir(componentDir, { recursive: true });
  console.log(`  ✓ Created ${componentDir}`);
  
  // Write Canvas component
  const canvasPath = join(componentDir, `${pascal}Canvas.tsx`);
  await writeFile(canvasPath, generateCanvas(name));
  console.log(`  ✓ Created ${pascal}Canvas.tsx`);
  
  // Write CSS
  const cssPath = join(componentDir, `${name}.css`);
  await writeFile(cssPath, generateCSS(name));
  console.log(`  ✓ Created ${name}.css`);
  
  // Write index
  const indexPath = join(componentDir, 'index.ts');
  await writeFile(indexPath, generateIndex(name));
  console.log(`  ✓ Created index.ts`);
  
  // Write schema
  await writeFile(schemaPath, generateSchema(name));
  console.log(`  ✓ Created schemas/${name}.ts`);
  
  console.log(`
✅ Renderer scaffolded successfully!

Next steps:
  1. Update src/schemas/index.ts to export the new schema
  2. Add route in App.tsx for the new renderer
  3. Customize the Canvas component for your visualization
  4. Run 'npm run build' to verify

Documentation: docs/RENDERER-GUIDE.md
`);
}

main().catch(console.error);
