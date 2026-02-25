# FlowStory Design System Reference

Consolidated design guidance for FlowStory's visual language — colors, typography, spacing, shadows, and design rules.

---

## Single Source of Truth

**`src/styles/tokens.css`** is the ONE canonical token file. All CSS custom properties are defined there for both light and dark themes. Never define tokens elsewhere.

**`src/themes/tokens.ts`** contains JS-side tokens and must stay aligned with the CSS file.

---

## Color Palette

FlowStory uses **Tailwind CSS colors** exclusively. No Material Design anywhere.

### Backgrounds

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#ffffff` | `#0f172a` |
| `--color-bg-secondary` | `#f8fafc` | `#1e293b` |
| `--color-bg-tertiary` | `#f1f5f9` | `#334155` |
| `--color-bg-elevated` | `#ffffff` | `#1e293b` |

### Text

| Token | Light | Dark |
|-------|-------|------|
| `--color-text` | `#0f172a` | `#f1f5f9` |
| `--color-text-secondary` | `#64748b` | `#94a3b8` |
| `--color-text-muted` | `#94a3b8` | `#64748b` |
| `--color-text-inverse` | `#ffffff` | — |

### Borders

| Token | Light | Dark |
|-------|-------|------|
| `--color-border` | `#e2e8f0` | `#334155` |
| `--color-border-strong` | `#cbd5e1` | `#475569` |

### Semantic Colors

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `--color-success` | `#10b981` | `#34d399` | Success, healthy |
| `--color-warning` | `#f59e0b` | `#fbbf24` | Warning, degraded |
| `--color-error` | `#ef4444` | `#f87171` | Error, danger, down |
| `--color-info` | `#3b82f6` | `#60a5fa` | Info, system |
| `--color-primary` | `#3b82f6` | `#60a5fa` | Brand, accent, buttons |

---

## Typography

**Font:** Inter (system-ui fallback chain)

### Scale (1.25 ratio)

| Token | Size |
|-------|------|
| `--fs-xs` | 10px |
| `--fs-sm` | 12px |
| `--fs-md` | 14px |
| `--fs-lg` | 18px |
| `--fs-xl` | 22px |
| `--fs-2xl` | 28px |
| `--fs-3xl` | 36px |

Aliases: `--font-size-xs` through `--font-size-xl` map to `--fs-*`.

### Weights

| Token | Value |
|-------|-------|
| `--fw-normal` | 400 |
| `--fw-medium` | 500 |
| `--fw-semibold` | 600 |
| `--fw-bold` | 700 |

### Line Heights

| Token | Value |
|-------|-------|
| `--lh-tight` | 1.2 |
| `--lh-normal` | 1.5 |
| `--lh-relaxed` | 1.75 |

---

## Spacing

4px base grid. Use `--space-N` tokens:

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

---

## Shadows & Elevation

Boosted for visible depth:

| Token | Value | Use For |
|-------|-------|---------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle cards |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` | Buttons |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)` | Cards, nodes |
| `--shadow-lg` | `0 10px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)` | Overlays |
| `--shadow-xl` | `0 20px 30px rgba(0,0,0,0.14), 0 10px 12px rgba(0,0,0,0.06)` | Modals |
| `--shadow-focus` | `0 0 0 3px rgba(59,130,246,0.35)` | Focus ring |

Dark mode uses stronger shadows for contrast.

---

## Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

---

## Node Color Semantics

### Story-Flow Node Types

| Type | Background | Border | Text |
|------|-----------|--------|------|
| System | `#EFF6FF` | `#3B82F6` | `#1E40AF` |
| Action | `#F0FDF4` | `#22C55E` | `#166534` |
| Event | `#FFFBEB` | `#F59E0B` | `#92400E` |
| Decision | `#FFF7ED` | `#F97316` | `#9A3412` |
| Actor | `#FAF5FF` | `#A855F7` | `#6B21A8` |

### Service-Flow Service Types (9)

| Type | Border Color | CSS Token |
|------|-------------|-----------|
| api | `#3B82F6` (blue) | `--svc-border-api` |
| worker | `#A855F7` (purple) | `--svc-border-worker` |
| gateway | `#F59E0B` (amber) | `--svc-border-gateway` |
| database | `#78716C` (stone) | `--svc-border-database` |
| cache | `#06B6D4` (cyan) | `--svc-border-cache` |
| external | `#64748B` (slate) | `--svc-border-external` |
| event-bus | `#F97316` (orange) | `--svc-border-event-bus` |
| workflow | `#EC4899` (pink) | `--svc-border-workflow` |
| event-processor | `#8B5CF6` (violet) | `--svc-border-event-processor` |

---

## Edge Color Semantics

| Edge Type | Color | Hex | CSS Token |
|-----------|-------|-----|-----------|
| Default | Slate | `#94A3B8` | `--edge-default` |
| Flow/Primary | Blue | `#3B82F6` | `--edge-flow` |
| Error | Red | `#EF4444` | `--edge-error` |
| Success | Green | `#22C55E` | `--edge-success` |
| Async | Purple | `#8B5CF6` | `--edge-async` |

### Service-Flow Call Type Colors

| Call Type | Color | Hex |
|-----------|-------|-----|
| sync | Blue | `#3B82F6` |
| async | Purple | `#A855F7` |
| publish | Amber | `#F59E0B` |
| subscribe | Teal | `#14B8A6` |

---

## Renderer-Specific Palettes

### Event Storming

| Element | Color | Token |
|---------|-------|-------|
| Event | `#F97316` | `--es-event` |
| Command | `#3B82F6` | `--es-command` |
| Aggregate | `#FBBF24` | `--es-aggregate` |
| Policy | `#C084FC` | `--es-policy` |
| Hotspot | `#EF4444` | `--es-hotspot` |

### Tech Radar Rings

| Ring | Color | Token |
|------|-------|-------|
| Adopt | `#10B981` | `--radar-adopt` |
| Trial | `#3B82F6` | `--radar-trial` |
| Assess | `#F59E0B` | `--radar-assess` |
| Hold | `#EF4444` | `--radar-hold` |

### Cloud Cost Categories

| Category | Color | Token |
|----------|-------|-------|
| Compute | `#3B82F6` | `--cost-compute` |
| Storage | `#10B981` | `--cost-storage` |
| Database | `#8B5CF6` | `--cost-database` |
| Network | `#F59E0B` | `--cost-network` |
| Security | `#EF4444` | `--cost-security` |
| Monitoring | `#06B6D4` | `--cost-monitoring` |
| AI/ML | `#EC4899` | `--cost-ai-ml` |

---

## Dark Mode

Dark mode activates via `[data-theme="dark"]` attribute or `.dark` class. The `ThemeContext` sets `data-theme` and updates JS tokens via `setProperty()`.

### Key Dark Backgrounds

| Surface | Color |
|---------|-------|
| Base | `#0F172A` (Slate 900) |
| Secondary/Elevated | `#1E293B` (Slate 800) |
| Tertiary | `#334155` (Slate 700) |

### Testing Dark Mode

1. All text must be readable against dark backgrounds
2. Node colors have dedicated dark variants in `tokens.css`
3. Borders shift from light gray to `#334155` / `#475569`
4. Shadows use stronger opacity for contrast
5. Glows use brighter, more saturated colors

---

## Glass Morphism

Used for overlays and floating panels:

| Component | Background | Blur |
|-----------|-----------|------|
| StepOverlay | `rgba(255,255,255,0.92)` / `rgba(15,23,42,0.92)` | 12px |
| Narrative card | `rgba(17,24,39,0.97)` | 16px |
| Legend | `rgba(17,24,39,0.95)` | 12px |

---

## Design Rules

### 1. No `background: white`

Always use `var(--color-bg-elevated)` or `var(--color-bg)`. Hardcoded white breaks dark mode.

### 2. No `transition: all`

List explicit properties: `transition: opacity 200ms ease-out, transform 200ms ease-out`. Using `all` causes unexpected transitions on color, box-shadow, etc.

### 3. No Hardcoded Hex in CSS

Outside of `tokens.css`, all colors must reference token variables. This ensures dark mode and theme switching work.

### 4. 8px Grid

All spacing, sizing, and padding use the 4px base grid (`--space-N` tokens). Node sizes follow SIZE_PRESETS (xs/s/m/l/xl).

### 5. Semantic Color Usage

Color carries meaning — don't use blue for errors or red for success:
- Blue = system, info, API
- Green = success, healthy, action
- Red = error, danger, down
- Amber/Orange = warning, event, decision
- Purple = async, actor, queue

### 6. Monospace for Technical Text

Use monospace font for code snippets, IDs, metrics, and technical values.

### 7. Accessibility

- Support `prefers-reduced-motion` (tokens set `--transition-*: 0ms`)
- Maintain sufficient contrast ratios
- Focus rings via `--shadow-focus`

---

## Token Usage Examples

### Before (wrong)

```css
.my-card {
  background: white;
  color: #333;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
```

### After (correct)

```css
.my-card {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
```
