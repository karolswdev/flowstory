/**
 * Renderer type definitions for the multi-renderer architecture
 * @module types/renderer
 */

import type { ComponentType } from 'react';
import type { UserStory, StoryStep, ValidationResult } from './story';

import type { ZoomLevel } from './story';

/**
 * Props passed to renderer Canvas component
 */
export interface CanvasProps {
  /** The loaded story data */
  story: UserStory;
  /** IDs of currently active nodes */
  activeNodeIds: Set<string>;
  /** IDs of currently active edges */
  activeEdgeIds: Set<string>;
  /** IDs of completed nodes */
  completedNodeIds: Set<string>;
  /** IDs of completed edges */
  completedEdgeIds: Set<string>;
  /** Show minimap (if supported) */
  showMinimap?: boolean;
  /** Show zoom/pan controls (if supported) */
  showControls?: boolean;
  /** Show background grid (if supported) */
  showBackground?: boolean;
  /** Current zoom level for architectural renderer */
  zoomLevel?: ZoomLevel;
  /** Callback when zoom level changes */
  onZoomLevelChange?: (level: ZoomLevel) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * Props passed to renderer Panel component
 */
export interface PanelProps {
  /** The loaded story data */
  story: UserStory;
  /** Current step data */
  currentStep: StoryStep | null;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Show story header */
  showHeader?: boolean;
  /** Show next step preview */
  showNextPreview?: boolean;
  /** Show step badge */
  showStepBadge?: boolean;
  /** Optional CSS class */
  className?: string;
}

/**
 * Props passed to renderer Controls component
 */
export interface ControlsProps {
  /** Is auto-play active */
  isPlaying: boolean;
  /** Can navigate to next step */
  canGoNext: boolean;
  /** Can navigate to previous step */
  canGoPrev: boolean;
  /** Current step index */
  currentStepIndex: number;
  /** Total steps */
  totalSteps: number;
  /** Start auto-play */
  onPlay: () => void;
  /** Pause auto-play */
  onPause: () => void;
  /** Toggle play/pause */
  onToggle: () => void;
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrev: () => void;
  /** Reset to first step */
  onReset: () => void;
  /** Jump to last step */
  onEnd: () => void;
  /** Jump to specific step */
  onSeek: (stepIndex: number) => void;
  /** Show keyboard hints */
  showHints?: boolean;
  /** Optional CSS class */
  className?: string;
}

/**
 * Feature support flags for a renderer
 */
export interface RendererCapabilities {
  /** Supports BC region containers */
  regions?: boolean;
  /** Supports infrastructure elements (bus, queue) */
  infrastructure?: boolean;
  /** Supports zoom levels (exec/manager/engineer) */
  zoomLevels?: boolean;
  /** Supports step animation */
  animation?: boolean;
  /** Supports image export */
  export?: boolean;
  /** Supports minimap */
  minimap?: boolean;
  /** Supports auto-layout (ignores manual positions) */
  autoLayout?: boolean;
}

/**
 * Layout mode for the renderer
 */
export type LayoutMode = 'manual' | 'auto';

/**
 * Main renderer interface
 * 
 * A renderer provides the visual representation of a story.
 * Different renderers can show the same story data in different ways.
 * 
 * @example
 * ```typescript
 * const MyRenderer: StoryRenderer = {
 *   id: 'my-renderer',
 *   name: 'My Custom Renderer',
 *   layoutMode: 'auto',
 *   capabilities: { animation: true },
 *   Canvas: MyCanvasComponent,
 * };
 * ```
 */
export interface StoryRenderer {
  /** Unique identifier (e.g., 'flow', 'architectural') */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of the renderer */
  description?: string;
  
  /** Layout mode - 'manual' uses YAML positions, 'auto' calculates layout */
  layoutMode: LayoutMode;
  
  /** Feature support flags */
  capabilities: RendererCapabilities;
  
  /**
   * Main canvas component (required)
   * Renders the story visualization
   */
  Canvas: ComponentType<CanvasProps>;
  
  /**
   * Panel component (optional)
   * If not provided, uses default StoryPanel
   */
  Panel?: ComponentType<PanelProps>;
  
  /**
   * Controls component (optional)
   * If not provided, uses default PlaybackControls
   */
  Controls?: ComponentType<ControlsProps>;
  
  /**
   * Validate story for this renderer (optional)
   * Returns errors if story uses unsupported features
   */
  validateStory?: (story: UserStory) => ValidationResult;
  
  /**
   * Pre-process story before rendering (optional)
   * Can add computed properties, layout data, etc.
   */
  prepareStory?: (story: UserStory) => UserStory;
}
