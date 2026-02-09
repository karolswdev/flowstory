import { memo, useLayoutEffect, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './spotlight.css';

/**
 * Region to highlight in spotlight
 */
export interface SpotlightRegion {
  /** DOM element reference */
  element?: HTMLElement;
  /** Explicit bounds (used if element not provided) */
  bounds?: { x: number; y: number; width: number; height: number };
  /** Optional label for multi-region scenarios */
  label?: string;
}

/**
 * SpotlightOverlay props
 */
interface SpotlightOverlayProps {
  /** Regions to highlight (supports multiple) */
  regions: SpotlightRegion[];
  /** Dim overlay opacity (0-1, default 0.6) */
  dimOpacity?: number;
  /** Padding around spotlight cutout (default 20px) */
  padding?: number;
  /** Border radius of spotlight (default 12px) */
  borderRadius?: number;
  /** Show glow border around spotlight */
  showGlow?: boolean;
  /** Whether spotlight is visible */
  visible?: boolean;
  /** Transition duration in ms */
  transitionDuration?: number;
}

/**
 * Default configuration
 */
const DEFAULTS = {
  dimOpacity: 0.6,
  padding: 20,
  borderRadius: 12,
  transitionDuration: 300,
};

/**
 * SpotlightOverlay - SVG mask overlay that dims everything except highlighted regions
 */
export const SpotlightOverlay = memo(function SpotlightOverlay({
  regions,
  dimOpacity = DEFAULTS.dimOpacity,
  padding = DEFAULTS.padding,
  borderRadius = DEFAULTS.borderRadius,
  showGlow = true,
  visible = true,
  transitionDuration = DEFAULTS.transitionDuration,
}: SpotlightOverlayProps) {
  const maskId = useId();
  const [bounds, setBounds] = useState<DOMRect[]>([]);

  // Calculate bounds from elements or explicit bounds
  useLayoutEffect(() => {
    if (!visible || regions.length === 0) {
      setBounds([]);
      return;
    }

    const calculated = regions.map(region => {
      if (region.bounds) {
        return new DOMRect(
          region.bounds.x,
          region.bounds.y,
          region.bounds.width,
          region.bounds.height
        );
      }
      if (region.element) {
        return region.element.getBoundingClientRect();
      }
      return new DOMRect(0, 0, 0, 0);
    }).filter(rect => rect.width > 0 && rect.height > 0);

    setBounds(calculated);
  }, [regions, visible]);

  if (!visible || bounds.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.svg
        className="spotlight-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: transitionDuration / 1000 }}
        data-testid="spotlight-overlay"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId}>
            {/* White background = visible through mask */}
            <rect width="100%" height="100%" fill="white" />
            
            {/* Black cutouts = transparent holes */}
            {bounds.map((rect, i) => (
              <motion.rect
                key={i}
                x={rect.x - padding}
                y={rect.y - padding}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx={borderRadius}
                fill="black"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
              />
            ))}
          </mask>
        </defs>

        {/* Dim overlay with spotlight cutouts */}
        <rect
          width="100%"
          height="100%"
          fill={`rgba(0, 0, 0, ${dimOpacity})`}
          mask={`url(#${maskId})`}
          className="spotlight-dim"
        />

        {/* Spotlight glow borders */}
        {showGlow && bounds.map((rect, i) => (
          <motion.rect
            key={`glow-${i}`}
            x={rect.x - padding}
            y={rect.y - padding}
            width={rect.width + padding * 2}
            height={rect.height + padding * 2}
            rx={borderRadius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={2}
            className="spotlight-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        ))}
      </motion.svg>
    </AnimatePresence>
  );
});

export default SpotlightOverlay;
