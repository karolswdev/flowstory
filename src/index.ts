/**
 * User Story Visualization Engine
 * 
 * Interactive, animated visualizations for user stories and journey maps.
 * 
 * @example
 * ```tsx
 * import { UserStoryViewer } from 'user-story-viz';
 * 
 * function App() {
 *   return <UserStoryViewer story={yamlString} />;
 * }
 * ```
 * 
 * @example Headless usage
 * ```tsx
 * import { 
 *   StoryProvider, 
 *   useStory, 
 *   usePlayback,
 *   parseStory 
 * } from 'user-story-viz';
 * 
 * function CustomViewer({ yaml }) {
 *   const { story } = parseStory(yaml);
 *   return (
 *     <StoryProvider>
 *       <MyCustomCanvas story={story} />
 *       <MyCustomControls />
 *     </StoryProvider>
 *   );
 * }
 * ```
 */

// Main component
export { UserStoryViewer } from './components/UserStoryViewer';
export type { UserStoryViewerProps } from './components/UserStoryViewer';

// Context and hooks (for headless usage)
export { 
  StoryProvider,
  StoryContext,
  useStory,
  useCurrentStep,
  useStoryNavigation,
  usePlayback,
} from './context';

// Theme system
export { 
  ThemeProvider, 
  ThemeContext,
  useTheme,
  lightTheme,
  darkTheme,
} from './themes';
export type { Theme, ThemeTokens } from './themes';

// Individual components (for custom composition)
export { StoryCanvas } from './components/StoryCanvas';
export type { StoryCanvasProps } from './components/StoryCanvas';

export { StoryPanel } from './components/StoryPanel';
export type { StoryPanelProps } from './components/StoryPanel';

export { PlaybackControls } from './components/PlaybackControls';
export type { PlaybackControlsProps } from './components/PlaybackControls';

export { ThemeToggle } from './components/ThemeToggle';
export type { ThemeToggleProps } from './components/ThemeToggle';

export { ExportButton } from './components/ExportButton';
export type { ExportButtonProps } from './components/ExportButton';

// Node components
export { 
  ActorNode,
  ActionNode,
  DecisionNode,
  SystemNode,
  EventNode,
  StateNode,
  nodeTypes,
} from './components/nodes';

// Edge components
export { 
  FlowEdge,
  EventEdge,
  ErrorEdge,
  AsyncEdge,
  EdgeMarkers,
  edgeTypes,
} from './components/edges';

// Renderers
export {
  registerRenderer,
  getRenderer,
  getAllRenderers,
  hasRenderer,
  FlowRenderer,
  ArchitecturalRenderer,
} from './renderers';

// Renderer types
export type {
  StoryRenderer,
  CanvasProps,
  PanelProps,
  ControlsProps,
  RendererCapabilities,
  LayoutMode,
} from './types/renderer';

// Canvas components (for custom usage)
export { FlowCanvas } from './components/FlowCanvas';
export { ArchitecturalCanvas } from './components/ArchitecturalCanvas';

// Utilities
export { parseStory, validateStory } from './utils/parser';
export { 
  exportToPng, 
  exportToSvg, 
  exportAndDownload,
  getExportableElement,
} from './utils/export';
export type { ExportOptions, ExportFormat } from './utils/export';

// Architectural validation
export {
  validateArchitecturalStory,
  inferActiveBCs,
  isCrossBCEdge,
  migrateToV2,
} from './utils/architectural-validator';
export type { ArchitecturalValidationResult } from './utils/architectural-validator';

// Zod schemas
export {
  UserStorySchema,
  StoryNodeSchema,
  StoryEdgeSchema,
  StoryStepSchema,
  BoundedContextDefSchema,
  OrchestrationDefSchema,
  InfrastructureElementSchema,
  validateWithZod,
  isArchitecturalSchema,
} from './schemas';

// Types
export type {
  UserStory,
  Actor,
  StoryNode,
  StoryEdge,
  StoryStep,
  NodeType,
  EdgeType,
  Position,
  ValidationResult,
} from './types/story';
