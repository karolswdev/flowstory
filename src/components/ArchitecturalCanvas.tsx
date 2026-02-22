import { motion, AnimatePresence } from 'motion/react';
/**
 * Architectural Canvas - BC-aware visualization with swim lanes
 * 
 * This renderer shows bounded contexts as swim lanes with auto-layout.
 * Designed for architectural views showing event flow across BCs.
 * 
 * @module components/ArchitecturalCanvas
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Panel,
  useReactFlow,
  type Node, 
  type Edge,
  type ReactFlowInstance,
} from '@xyflow/react';
import { nodeTypes } from './nodes';
import { edgeTypes, EdgeMarkers } from './edges';
import { LegendPanel } from './legend';
import { useArchitecturalLayout } from '../hooks/useArchitecturalLayout';
import { LAYOUT_CONFIG as ENGINE_LAYOUT_CONFIG, type BCRegion as EngineBCRegion } from '../utils/layout';
import type { CanvasProps } from '../types/renderer';
import type { UserStory, StoryNode, StoryEdge, BoundedContextDef, Layer, ZoomLevel } from '../types/story';
import '@xyflow/react/dist/style.css';
import './nodes/nodes.css';
import './edges/edges.css';
import './ArchitecturalCanvas.css';

// ============================================================================
// Layout Configuration
// ============================================================================

const LAYOUT_CONFIG = {
  padding: 60,
  orchestrationHeight: 140,
  domainMinHeight: 400,
  infrastructureHeight: 100,
  bcMinWidth: 320,        // Wider to fit "Enrollment & Demand" etc
  bcPadding: 40,          // More internal breathing room
  bcGap: 50,              // More space between BCs
  bcHeaderHeight: 48,
  nodeWidth: 140,         // Slightly smaller nodes
  nodeHeight: 50,
  nodeGapX: 60,           // More horizontal spacing
  nodeGapY: 50,           // More vertical spacing
};

// Zoom level configuration
const ZOOM_LEVELS: { id: ZoomLevel; label: string; icon: string }[] = [
  { id: 'executive', label: 'Executive', icon: '👔' },
  { id: 'manager', label: 'Manager', icon: '📊' },
  { id: 'engineer', label: 'Engineer', icon: '🔧' },
];

// Zoom level visibility hierarchy: executive < manager < engineer
const ZOOM_LEVEL_ORDER: Record<ZoomLevel, number> = {
  executive: 0,
  manager: 1,
  engineer: 2,
};

/**
 * Check if a node/edge should be visible at the current zoom level
 */
function isVisibleAtZoomLevel(elementZoomLevel: ZoomLevel | undefined, currentZoomLevel: ZoomLevel): boolean {
  // If no zoom level specified, show at all levels
  if (!elementZoomLevel) return true;
  // Show if current level >= element's minimum level
  return ZOOM_LEVEL_ORDER[currentZoomLevel] >= ZOOM_LEVEL_ORDER[elementZoomLevel];
}

// Default BC colors
const DEFAULT_BC_COLORS: Record<string, string> = {
  'enrollment-demand': '#2196F3',
  'trip-operations': '#009688',
  'assignment': '#3F51B5',
  'routing-pricing': '#00BCD4',
  'provider-network': '#4CAF50',
  'settlement': '#FFC107',
  'communications': '#E91E63',
  'compliance': '#9C27B0',
  'monitoring': '#FF5722',
  'identity': '#795548',
  'reporting': '#607D8B',
  'incidents': '#F44336',
  'capacity': '#8BC34A',
  'rescue': '#FF5722',
  'default': '#9E9E9E',
};

// ============================================================================
// Layout Algorithm
// ============================================================================

interface BCLayout {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodes: StoryNode[];
}

interface LayoutResult {
  bcLayouts: BCLayout[];
  nodePositions: Map<string, { x: number; y: number }>;
  orchestrationY: number;
  domainY: number;
  infrastructureY: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Calculate auto-layout for architectural story
 */
function calculateLayout(
  story: UserStory,
  activeNodeIds: Set<string>,
  completedNodeIds: Set<string>
): LayoutResult {
  const { padding, bcMinWidth, bcPadding, bcGap, bcHeaderHeight, nodeWidth, nodeHeight, nodeGapX, nodeGapY } = LAYOUT_CONFIG;
  
  // Get BC definitions or create defaults
  const bcDefs = story.boundedContexts || [];
  const bcMap = new Map(bcDefs.map(bc => [bc.id, bc]));
  
  // Group visible nodes by BC
  const visibleNodes = story.nodes.filter(n => 
    activeNodeIds.has(n.id) || completedNodeIds.has(n.id)
  );
  
  const nodesByBC = new Map<string, StoryNode[]>();
  visibleNodes.forEach(node => {
    const bcId = node.boundedContext || 'default';
    if (!nodesByBC.has(bcId)) {
      nodesByBC.set(bcId, []);
    }
    nodesByBC.get(bcId)!.push(node);
  });

  // Calculate BC layouts
  const bcLayouts: BCLayout[] = [];
  let currentX = padding;
  const domainY = padding + LAYOUT_CONFIG.orchestrationHeight + 20;

  // Get BC order (by first appearance in nodes, or from definitions)
  const bcOrder = bcDefs.length > 0 
    ? bcDefs.map(bc => bc.id)
    : [...nodesByBC.keys()];

  bcOrder.forEach(bcId => {
    const nodes = nodesByBC.get(bcId) || [];
    if (nodes.length === 0 && !bcMap.has(bcId)) return;
    
    const bcDef = bcMap.get(bcId);
    
    // Calculate grid layout for nodes within BC
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const rows = Math.ceil(nodes.length / cols);
    
    const contentWidth = cols * (nodeWidth + nodeGapX) - nodeGapX;
    const contentHeight = rows * (nodeHeight + nodeGapY) - nodeGapY;
    
    const bcWidth = Math.max(bcMinWidth, contentWidth + bcPadding * 2);
    const bcHeight = bcHeaderHeight + Math.max(100, contentHeight + bcPadding * 2);

    bcLayouts.push({
      id: bcId,
      name: bcDef?.name || bcId,
      color: bcDef?.color || DEFAULT_BC_COLORS[bcId] || DEFAULT_BC_COLORS['default'],
      x: currentX,
      y: domainY,
      width: bcWidth,
      height: bcHeight,
      nodes,
    });

    currentX += bcWidth + bcGap;
  });

  // Calculate node positions within each BC
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  bcLayouts.forEach(bc => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(bc.nodes.length)));
    
    bc.nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      nodePositions.set(node.id, {
        x: bc.x + bcPadding + col * (nodeWidth + nodeGapX),
        y: bc.y + bcHeaderHeight + bcPadding + row * (nodeHeight + nodeGapY),
      });
    });
  });

  const totalWidth = currentX - bcGap + padding;
  const totalHeight = domainY + LAYOUT_CONFIG.domainMinHeight + LAYOUT_CONFIG.infrastructureHeight + padding;

  return {
    bcLayouts,
    nodePositions,
    orchestrationY: padding,
    domainY,
    infrastructureY: totalHeight - LAYOUT_CONFIG.infrastructureHeight - padding,
    totalWidth,
    totalHeight,
  };
}

// ============================================================================
// BC Region Component
// ============================================================================

interface BCRegionProps {
  layout: BCLayout;
  isActive: boolean;
}

function BCRegion({ layout, isActive }: BCRegionProps) {
  return (
    <motion.div
      className="bc-region"
      data-testid={`bc-region-${layout.id}`}
      initial={{ opacity: 0.4 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5,
        boxShadow: isActive 
          ? `0 0 20px ${layout.color}40`
          : 'none',
      }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute',
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
        backgroundColor: `${layout.color}10`,
        border: `2px solid ${layout.color}`,
        borderRadius: 12,
        pointerEvents: 'none',
      }}
    >
      <div 
        className="bc-region-header"
        style={{
          padding: '8px 12px',
          backgroundColor: layout.color,
          color: 'white',
          borderRadius: '10px 10px 0 0',
          fontWeight: 600,
          fontSize: 14,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 120,
        }}
        title={layout.name}
      >
        {layout.name}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Orchestration Layer Component
// ============================================================================

interface OrchestrationLayerProps {
  story: UserStory;
  currentStep?: string;
  width: number;
}

function OrchestrationLayer({ story, currentStep, width }: OrchestrationLayerProps) {
  const orchestration = story.orchestration;
  if (!orchestration) return null;

  const steps = orchestration.steps || [];
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  // Support both strict format (name) and flexible format (conductor)
  const orchestrationName = orchestration.name || orchestration.conductor || 'Orchestration';

  return (
    <motion.div
      className="orchestration-layer"
      data-testid="orchestration-layer"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'absolute',
        left: LAYOUT_CONFIG.padding,
        top: LAYOUT_CONFIG.padding,
        width: width - LAYOUT_CONFIG.padding * 2,
        height: LAYOUT_CONFIG.orchestrationHeight - 20,
        backgroundColor: 'rgba(124, 77, 255, 0.1)',
        border: '2px solid #7C4DFF',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <span style={{ fontWeight: 600, color: '#7C4DFF' }}>
          {orchestrationName}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              className="orch-step"
              animate={{
                backgroundColor: i < currentIndex ? '#4CAF50' 
                  : i === currentIndex ? '#7C4DFF' 
                  : '#E0E0E0',
                scale: i === currentIndex ? 1.1 : 1,
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {i < currentIndex ? '✓' : i + 1}
            </motion.div>
            {i < steps.length - 1 && (
              <div style={{ 
                width: 30, 
                height: 2, 
                backgroundColor: i < currentIndex ? '#4CAF50' : '#E0E0E0',
                marginLeft: 4,
              }} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Infrastructure Layer Component
// ============================================================================

interface InfrastructureLayerProps {
  story: UserStory;
  y: number;
  width: number;
  activeEvents?: string[];
}

function InfrastructureLayer({ story, y, width, activeEvents = [] }: InfrastructureLayerProps) {
  // Support both array format and object format for infrastructure
  let infrastructure: Array<{ id: string; type: string; name: string }> = [];
  let bus: { id: string; type: string; name: string } | undefined;
  
  if (Array.isArray(story.infrastructure)) {
    infrastructure = story.infrastructure;
    bus = infrastructure.find(i => i.type === 'bus');
  } else if (story.infrastructure && typeof story.infrastructure === 'object') {
    // Handle object format: { serviceBus: { name, topics } }
    const infraObj = story.infrastructure as Record<string, unknown>;
    if (infraObj.serviceBus) {
      const sb = infraObj.serviceBus as { name?: string; topics?: string[] };
      bus = { id: 'service-bus', type: 'bus', name: sb.name || 'Service Bus' };
      infrastructure = [bus];
    }
  }
  
  if (!bus && infrastructure.length === 0) return null;

  return (
    <motion.div
      className="infrastructure-layer"
      data-testid="infrastructure-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute',
        left: LAYOUT_CONFIG.padding,
        top: y,
        width: width - LAYOUT_CONFIG.padding * 2,
        height: LAYOUT_CONFIG.infrastructureHeight - 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div 
        style={{
          width: '100%',
          height: 40,
          backgroundColor: 'rgba(255, 152, 0, 0.15)',
          border: '2px solid #FF9800',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <span style={{ fontWeight: 600, color: '#FF9800' }}>
          {bus?.name || 'Service Bus'}
        </span>
        <AnimatePresence>
          {activeEvents.map(event => (
            <motion.span
              key={event}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#FF9800',
                color: 'white',
                borderRadius: 12,
                fontSize: 12,
              }}
            >
              {event}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Canvas Component
// ============================================================================

/** Convert story node to React Flow node with architectural layout */
function toArchitecturalNode(
  node: StoryNode,
  story: UserStory,
  position: { x: number; y: number },
  activeNodeIds: Set<string>,
  completedNodeIds: Set<string>
): Node {
  const actor = node.actorId ? story.actors.find(a => a.id === node.actorId) : null;
  const isActive = activeNodeIds.has(node.id);
  const isComplete = completedNodeIds.has(node.id);
  const isVisible = isActive || isComplete;

  return {
    id: node.id,
    type: node.type,
    position,
    data: {
      label: node.label,
      description: node.description,
      isActive,
      isComplete,
      actorId: node.actorId,
      avatar: actor?.avatar,
      color: actor?.color,
      variant: node.data?.variant,
    },
    hidden: !isVisible,
  };
}

/** Convert story edge to React Flow edge */
function toArchitecturalEdge(
  edge: StoryEdge,
  activeEdgeIds: Set<string>,
  completedEdgeIds: Set<string>
): Edge {
  const isActive = activeEdgeIds.has(edge.id);
  const isComplete = completedEdgeIds.has(edge.id);
  const isVisible = isActive || isComplete;

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: {
      label: edge.label,
      isActive,
      crossBC: edge.crossBC,
    },
    hidden: !isVisible,
    animated: edge.animated || isActive,
    style: edge.crossBC ? { strokeWidth: 3 } : undefined,
  };
}

/**
 * ArchitecturalCanvas - BC-aware story visualization with swim lanes
 */
export function ArchitecturalCanvas({
  story,
  activeNodeIds,
  activeEdgeIds,
  completedNodeIds,
  completedEdgeIds,
  showMinimap = true,
  showControls = true,
  showBackground = true,
  zoomLevel: externalZoomLevel,
  onZoomLevelChange,
  className = '',
}: CanvasProps) {
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  
  // Internal zoom level state (can be controlled externally)
  const [internalZoomLevel, setInternalZoomLevel] = useState<ZoomLevel>('engineer');
  const zoomLevel = externalZoomLevel ?? internalZoomLevel;
  
  const setZoomLevel = useCallback((level: ZoomLevel) => {
    setInternalZoomLevel(level);
    onZoomLevelChange?.(level);
  }, [onZoomLevelChange]);
  
  // Pre-computed layout (computed ONCE at story load)
  const precomputedLayout = useArchitecturalLayout(story);
  
  // Keyboard shortcuts for zoom levels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case '1':
          setZoomLevel('executive');
          break;
        case '2':
          setZoomLevel('manager');
          break;
        case '3':
          setZoomLevel('engineer');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setZoomLevel]);

  // Calculate layout - use precomputed positions when available
  const layout = useMemo(() => {
    // If we have precomputed layout, merge with visibility info
    if (precomputedLayout) {
      // Build BC layouts from precomputed BC regions
      const bcLayouts: BCLayout[] = precomputedLayout.bcRegions.map(region => ({
        id: region.id,
        name: story.boundedContexts?.find(bc => bc.id === region.id)?.name || region.id,
        color: region.color,
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        nodes: story.nodes.filter(n => n.boundedContext === region.id),
      }));
      
      return {
        bcLayouts,
        nodePositions: precomputedLayout.nodePositions,
        orchestrationY: ENGINE_LAYOUT_CONFIG.layerY.orchestration,
        domainY: ENGINE_LAYOUT_CONFIG.layerY.domain,
        infrastructureY: ENGINE_LAYOUT_CONFIG.layerY.infrastructure,
        totalWidth: precomputedLayout.canvasBounds.width,
        totalHeight: precomputedLayout.canvasBounds.height,
      };
    }
    
    // Fallback to dynamic layout
    return calculateLayout(story, activeNodeIds, completedNodeIds);
  }, [story, activeNodeIds, completedNodeIds, precomputedLayout]);

  // Get active BCs from current step
  const activeBCs = useMemo(() => {
    const currentStep = story.steps.find((_, i) => {
      const nodeIds = story.steps[i]?.nodeIds || story.steps[i]?.activeNodes || [];
      return nodeIds.some(id => activeNodeIds.has(id));
    });
    return new Set(currentStep?.activeBCs || []);
  }, [story, activeNodeIds]);

  // Get current orchestration step
  const currentOrchStep = useMemo(() => {
    const currentStep = story.steps.find((_, i) => {
      const nodeIds = story.steps[i]?.nodeIds || story.steps[i]?.activeNodes || [];
      return nodeIds.some(id => activeNodeIds.has(id));
    });
    return currentStep?.orchestrationStep;
  }, [story, activeNodeIds]);

  // Convert to React Flow format with calculated positions, filtered by zoom level
  const nodes = useMemo(() => {
    return story.nodes
      .filter(node => activeNodeIds.has(node.id) || completedNodeIds.has(node.id))
      .filter(node => isVisibleAtZoomLevel(node.zoomLevel, zoomLevel))
      .map(node => {
        const position = layout.nodePositions.get(node.id) || node.position;
        return toArchitecturalNode(node, story, position, activeNodeIds, completedNodeIds);
      });
  }, [story, layout, activeNodeIds, completedNodeIds, zoomLevel]);

  const edges = useMemo(() => {
    return story.edges
      .filter(edge => isVisibleAtZoomLevel(edge.zoomLevel, zoomLevel))
      .map(edge => toArchitecturalEdge(edge, activeEdgeIds, completedEdgeIds));
  }, [story, activeEdgeIds, completedEdgeIds, zoomLevel]);

  // Fit view on layout change
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowRef.current = instance;
    setTimeout(() => {
      instance.fitView({ padding: 0.2, duration: 300 });
    }, 100);
  }, []);

  useEffect(() => {
    if (reactFlowRef.current) {
      reactFlowRef.current.fitView({ padding: 0.2, duration: 500 });
    }
  }, [layout]);

  return (
    <div 
      className={`architectural-canvas ${className}`} 
      data-testid="architectural-canvas"
      data-zoom={zoomLevel}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Overlay layers (rendered outside React Flow for proper positioning) */}
      <div className="architectural-overlays" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <OrchestrationLayer 
          story={story} 
          currentStep={currentOrchStep}
          width={layout.totalWidth}
        />
        
        {layout.bcLayouts.map(bc => (
          <BCRegion 
            key={bc.id} 
            layout={bc} 
            isActive={activeBCs.has(bc.id) || bc.nodes.some(n => activeNodeIds.has(n.id))}
          />
        ))}
        
        <InfrastructureLayer 
          story={story}
          y={layout.infrastructureY}
          width={layout.totalWidth}
        />
      </div>

      {/* React Flow canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        style={{ zIndex: 2 }}
      >
        <EdgeMarkers />
        {showBackground && <Background gap={20} size={1} />}
        {showControls && <Controls showInteractive={false} />}
        {showMinimap && (
          <MiniMap 
            nodeColor={(node) => {
              if (node.data?.isActive) return '#7C4DFF';
              if (node.data?.isComplete) return '#4CAF50';
              return '#E0E0E0';
            }}
            maskColor="rgba(0,0,0,0.1)"
          />
        )}
        
        {/* Zoom Level Selector */}
        <Panel position="top-right" className="zoom-level-panel">
          <div 
            className="zoom-level-selector"
            data-testid="zoom-level-selector"
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            {ZOOM_LEVELS.map(level => (
              <button
                key={level.id}
                data-testid={`zoom-level-${level.id}`}
                onClick={() => setZoomLevel(level.id)}
                title={`${level.label} View (Press ${ZOOM_LEVELS.indexOf(level) + 1})`}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  backgroundColor: zoomLevel === level.id ? '#7C4DFF' : 'transparent',
                  color: zoomLevel === level.id ? 'white' : '#666',
                  fontWeight: zoomLevel === level.id ? 600 : 400,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{level.icon}</span>
                <span>{level.label}</span>
              </button>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {/* Legend Panel */}
      <LegendPanel
        boundedContexts={story.boundedContexts?.map(bc => ({
          id: bc.id,
          name: bc.shortName || bc.name,
          color: bc.color || DEFAULT_BC_COLORS[bc.id] || DEFAULT_BC_COLORS.default,
        }))}
        zoomLevel={zoomLevel}
        position="bottom-left"
      />
    </div>
  );
}

export default ArchitecturalCanvas;
