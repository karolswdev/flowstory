# FlowStory Renderer Development Guide

A comprehensive guide to building specialized renderers for FlowStory.

---

## 5-Minute Quickstart

```bash
# 1. Create folder structure
mkdir -p src/components/my-renderer

# 2. Create required files
touch src/components/my-renderer/MyRendererCanvas.tsx
touch src/components/my-renderer/my-renderer.css
touch src/components/my-renderer/index.ts

# 3. Create schema
touch src/schemas/my-renderer.ts

# 4. Wire up in App.tsx (add import and route)
```

Then follow the templates below.

---

## Folder Structure

```
src/components/<renderer-name>/
├── <RendererName>Canvas.tsx    # Main canvas component
├── <renderer-name>.css         # Component styles
├── index.ts                    # Exports
└── [SubComponent].tsx          # Optional sub-components
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folder | kebab-case | `tech-radar/` |
| Canvas | PascalCase + Canvas | `TechRadarCanvas.tsx` |
| CSS | kebab-case | `tech-radar.css` |
| Schema | kebab-case | `tech-radar.ts` |

---

## Required Files

### 1. Canvas Component (`<RendererName>Canvas.tsx`)

```tsx
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import type { MyStory, MyStep } from '../../schemas/my-renderer';
import './my-renderer.css';

interface MyRendererCanvasProps {
  story: MyStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

export function MyRendererCanvas({
  story,
  currentStepIndex,
  onStepChange,
}: MyRendererCanvasProps): JSX.Element {
  const currentStep = story.steps[currentStepIndex];
  
  // Compute visible elements based on currentStep
  const visibleElements = useMemo(() => {
    // Filter/compute based on step
    return story.elements.filter(el => 
      currentStep.activeElements?.includes(el.id)
    );
  }, [story.elements, currentStep]);

  return (
    <div className="my-renderer-canvas">
      {/* Main visualization */}
      <svg className="my-renderer-svg" viewBox="0 0 800 600">
        <AnimatePresence>
          {visibleElements.map((el, i) => (
            <motion.g
              key={el.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Render element */}
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>

      {/* Info panel */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            className="my-renderer-info"
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
      <div className="my-renderer-nav">
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

export default MyRendererCanvas;
```

### 2. CSS Styles (`<renderer-name>.css`)

```css
/* Canvas container */
.my-renderer-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-bg);
  overflow: auto;
}

/* SVG viewport */
.my-renderer-svg {
  width: 100%;
  height: calc(100vh - 200px);
}

/* Info panel - use design tokens */
.my-renderer-info {
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

.my-renderer-info h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  color: var(--color-text);
}

.my-renderer-info p {
  margin: 0;
  font-size: var(--fs-md);
  color: var(--color-text-secondary);
}

/* Navigation - use design tokens */
.my-renderer-nav {
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

.my-renderer-nav button {
  padding: var(--space-2) var(--space-3);
  border: none;
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  cursor: pointer;
}

.my-renderer-nav button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.my-renderer-nav span {
  font-size: var(--fs-sm);
  color: var(--color-text-secondary);
}
```

### 3. Index Export (`index.ts`)

```ts
export { MyRendererCanvas, default } from './MyRendererCanvas';
export type { MyRendererCanvasProps } from './MyRendererCanvas';
```

### 4. Schema (`src/schemas/<renderer-name>.ts`)

```ts
import { z } from 'zod';

// Define your data types
export const MyElementSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ... element-specific fields
});

export type MyElement = z.infer<typeof MyElementSchema>;

// Define step schema
export const MyStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  activeElements: z.array(z.string()).optional(),
  // ... step-specific fields
});

export type MyStep = z.infer<typeof MyStepSchema>;

// Define full story schema
export const MyStorySchema = z.object({
  title: z.string(),
  type: z.literal('my-renderer'),
  elements: z.array(MyElementSchema),
  steps: z.array(MyStepSchema),
});

export type MyStory = z.infer<typeof MyStorySchema>;
```

---

## Animation Guidelines

### Required Imports

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
```

### Standard Patterns

#### Info Panel Transitions
```tsx
<AnimatePresence mode="wait">
  {currentStep && (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={TRANSITION.default}
      key={currentStepIndex}  // Required for AnimatePresence
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>
```

#### Staggered Element Entry
```tsx
{elements.map((el, i) => (
  <motion.g
    key={el.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05 }}
  >
    {/* element */}
  </motion.g>
))}
```

#### Available Presets

| Preset | Use Case |
|--------|----------|
| `fadeUp` | Info panels, cards |
| `fadeIn` | Simple opacity |
| `scaleIn` | Emphasis entry |
| `slideInLeft/Right` | Side panels |
| `TRANSITION.default` | Standard timing |
| `TRANSITION.spring` | Bouncy feel |

---

## Design Token Reference

Always use CSS custom properties from `src/styles/tokens.css`:

### Colors
- `--color-bg` - Background
- `--color-bg-elevated` - Cards, panels
- `--color-text` - Primary text
- `--color-text-secondary` - Secondary text
- `--color-border` - Borders
- `--color-primary` - Accent/buttons

### Spacing
- `--space-1` through `--space-16` (4px base)

### Typography
- `--fs-xs` through `--fs-3xl`
- `--fw-normal`, `--fw-medium`, `--fw-semibold`, `--fw-bold`

### Borders & Shadows
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

---

## Testing Checklist

Before submitting a new renderer:

- [ ] **Build passes:** `npm run build` completes without errors
- [ ] **Step navigation works:** ← → buttons and keyboard arrows
- [ ] **Info panel animates:** Smooth entry/exit on step change
- [ ] **Responsive:** Works at 1920px, 1440px, 1024px widths
- [ ] **Dark mode:** Renders correctly with `[data-theme="dark"]`
- [ ] **Reduced motion:** Respects `prefers-reduced-motion`
- [ ] **Schema validates:** Story files parse without Zod errors

---

## Current Renderer Examples

| Renderer | Type | Key Pattern |
|----------|------|-------------|
| TechRadar | SVG radial | Quadrant layout, ring-based positioning |
| C4Context | SVG boxes | Zone-based layout with relationships |
| EventStorming | SVG sticky notes | Timeline with color-coded notes |
| ADRTimeline | SVG timeline | Chronological decision records |
| CloudCost | HTML cards | Bar charts with staggered animation |
| DependencyGraph | SVG radial | Service nodes with connections |
| MigrationRoadmap | HTML cards | Phase-based progress |
| TeamOwnership | HTML cards | Team-service grid |
| BCDeployment | ReactFlow | Radial artifact layout |
| BCComposition | ReactFlow | Progressive reveal |
| Pipeline | ReactFlow | Stage-based CI/CD |
| ServiceFlow | ReactFlow | Microservice sequences |
| HttpFlow | ReactFlow | HTTP request/response |

---

## Common Pitfalls

1. **Missing `key` on animated elements** - AnimatePresence requires unique keys
2. **Hardcoded colors** - Always use `var(--color-*)` tokens
3. **Missing dark mode** - Add `[data-theme="dark"]` overrides
4. **No exit animations** - Include `exit` variant for AnimatePresence
5. **Duplicated nav styles** - Reference existing patterns
6. **Missing schema validation** - Use Zod for runtime safety

---

## Getting Help

- Design tokens: `src/styles/tokens.css`
- Animation presets: `src/animation/presets.ts`
- Example renderers: `src/components/tech-radar/` (recommended reference)
