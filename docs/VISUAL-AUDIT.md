# FlowStory Visual Audit Checklist

Use this checklist when reviewing Canvas components for visual quality and consistency.

---

## Typography

- [ ] All font sizes use `var(--fs-*)` tokens
- [ ] Font weights use `var(--fw-*)` tokens  
- [ ] Line heights use `var(--lh-*)` tokens where applicable
- [ ] Text is readable at default zoom level
- [ ] No text truncation that loses meaning (minor truncation acceptable if tooltip/panel shows full text)

### Font Size Scale
| Token | Size | Usage |
|-------|------|-------|
| `--fs-xs` | 10px | Labels, badges, metadata |
| `--fs-sm` | 12px | Secondary text, captions |
| `--fs-md` | 14px | Body text, descriptions |
| `--fs-lg` | 18px | Headings, emphasis |
| `--fs-xl` | 22px | Major headings |
| `--fs-2xl` | 28px | Hero text |

---

## Spacing

- [ ] All padding uses `var(--space-*)` tokens
- [ ] All margins use `var(--space-*)` tokens
- [ ] All gaps use `var(--space-*)` tokens
- [ ] Consistent spacing rhythm (multiples of 4px)
- [ ] No magic pixel values in CSS

### Spacing Scale
| Token | Size | Usage |
|-------|------|-------|
| `--space-1` | 4px | Tight internal padding |
| `--space-2` | 8px | Default small gap |
| `--space-3` | 12px | Medium internal padding |
| `--space-4` | 16px | Standard padding |
| `--space-6` | 24px | Section spacing |
| `--space-8` | 32px | Major section breaks |

---

## Colors

- [ ] Uses semantic color tokens (`--color-success`, `--color-error`, etc.)
- [ ] Diagram-specific colors from tokens (`--svc-*`, `--cost-*`, `--radar-*`, etc.)
- [ ] No hardcoded hex values (except in tokens.css)
- [ ] Sufficient contrast for accessibility (WCAG AA minimum)
- [ ] Dark mode compatible

### Semantic Colors
| Token | Usage |
|-------|-------|
| `--color-success` | Positive states, completed, healthy |
| `--color-warning` | Caution states, degraded |
| `--color-error` | Error states, critical, blocked |
| `--color-info` | Informational, neutral emphasis |

---

## Borders & Shadows

- [ ] Border widths use `var(--border-width)` or `var(--border-width-thick)`
- [ ] Border radius uses `var(--radius-*)` tokens
- [ ] Shadows use `var(--shadow-*)` tokens
- [ ] Highlighted elements use `--shadow-focus` for accessibility

### Border Radius Scale
| Token | Size | Usage |
|-------|------|-------|
| `--radius-sm` | 4px | Buttons, badges |
| `--radius-md` | 8px | Cards, panels |
| `--radius-lg` | 12px | Modal containers |
| `--radius-full` | 9999px | Pills, circular elements |

---

## Animation

- [ ] Uses shared animation presets from `animation/presets.ts`
- [ ] Info panels use `fadeUp` variant
- [ ] Lists use `useStaggeredChildren` hook
- [ ] Respects `prefers-reduced-motion` (via hooks or CSS)
- [ ] No jarring or distracting motion
- [ ] Animation enhances understanding, doesn't distract

### Animation Checklist
| Element | Expected Behavior |
|---------|-------------------|
| Info panel | Fade up on step change |
| List items | Staggered entry |
| Highlights | Subtle emphasis (scale bump or glow) |
| Transitions | Smooth, < 400ms |

---

## Layout

- [ ] Canvas fills available space
- [ ] Info panel positioned at bottom center
- [ ] Navigation positioned at absolute bottom
- [ ] No content clipped unexpectedly
- [ ] Responsive to container size
- [ ] SVG viewBox scales appropriately

---

## Navigation

- [ ] Previous/Next buttons visible and styled consistently
- [ ] Disabled state clear when at first/last step
- [ ] Step counter shows "X / Y" format
- [ ] Keyboard navigation works (if implemented)

---

## Accessibility

- [ ] Interactive elements are focusable
- [ ] Focus states visible (`--shadow-focus`)
- [ ] Reduced motion preference respected
- [ ] Color not sole indicator of state
- [ ] Text alternatives for icons (where applicable)

---

## Dark Mode

- [ ] All colors adapt to dark theme
- [ ] Shadows remain visible but not harsh
- [ ] Text contrast maintained
- [ ] No white "flash" elements

---

## Quick Pass Checklist

For rapid review, check these essentials:

1. **No magic numbers** - All sizes use tokens
2. **Consistent nav** - Same pattern as other canvases
3. **Info panel** - Uses `fadeUp` + `TRANSITION.default`
4. **Dark mode** - Test with `[data-theme="dark"]`
5. **Reduced motion** - Test with system preference

---

## Sign-off

| Reviewer | Date | Status |
|----------|------|--------|
| | | ⬜ Not reviewed |

**Status Key:**
- ⬜ Not reviewed
- 🟡 Issues found (see notes)
- ✅ Approved
