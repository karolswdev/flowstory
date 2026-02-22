import { motion, AnimatePresence } from 'motion/react';
import { useState, useCallback, useEffect } from 'react';
import './legend.css';

/**
 * Node type information for legend
 */
interface NodeTypeInfo {
  type: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Edge type information for legend
 */
interface EdgeTypeInfo {
  type: string;
  label: string;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  color: string;
  description: string;
}

/**
 * Bounded context color information
 */
interface BCInfo {
  id: string;
  name: string;
  color: string;
}

/**
 * LegendPanel props
 */
interface LegendPanelProps {
  /** Bounded contexts to display in legend */
  boundedContexts?: BCInfo[];
  /** Custom node types (uses defaults if not provided) */
  nodeTypes?: NodeTypeInfo[];
  /** Custom edge types (uses defaults if not provided) */
  edgeTypes?: EdgeTypeInfo[];
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Position on canvas */
  position?: 'bottom-left' | 'bottom-right';
  /** Current zoom level for adaptive display */
  zoomLevel?: 'executive' | 'manager' | 'engineer';
  /** Callback when collapsed state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Default node types for architectural diagrams
 */
const DEFAULT_NODE_TYPES: NodeTypeInfo[] = [
  { type: 'step', icon: '○', label: 'Step', description: 'Workflow step' },
  { type: 'activeStep', icon: '◉', label: 'Active', description: 'Current step' },
  { type: 'bc', icon: '📦', label: 'BC', description: 'Bounded context' },
  { type: 'handler', icon: '⬡', label: 'Handler', description: 'Domain handler' },
  { type: 'event', icon: '⚡', label: 'Event', description: 'Domain event' },
  { type: 'external', icon: '☁️', label: 'External', description: 'External system' },
];

/**
 * Default edge types for architectural diagrams
 */
const DEFAULT_EDGE_TYPES: EdgeTypeInfo[] = [
  { type: 'flow', style: 'solid', color: '#4CAF50', label: 'Flow', description: 'Sequence' },
  { type: 'event', style: 'dashed', color: '#FFC107', label: 'Event', description: 'Async message' },
  { type: 'command', style: 'solid', color: '#7c4dff', label: 'Command', description: 'Orchestrated' },
  { type: 'query', style: 'dotted', color: '#8b5cf6', label: 'Query', description: 'Read request' },
];

/**
 * LegendPanel - Collapsible legend showing diagram elements
 */
export function LegendPanel({
  boundedContexts = [],
  nodeTypes = DEFAULT_NODE_TYPES,
  edgeTypes = DEFAULT_EDGE_TYPES,
  defaultCollapsed = false,
  position = 'bottom-left',
  zoomLevel = 'manager',
  onCollapsedChange,
}: LegendPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      onCollapsedChange?.(next);
      return next;
    });
  }, [onCollapsedChange]);

  // Keyboard shortcut: L to toggle legend
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        // Don't toggle if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapsed]);

  // Filter content based on zoom level
  const showNodes = zoomLevel !== 'executive';
  const showBCs = zoomLevel !== 'executive' && boundedContexts.length > 0;

  return (
    <motion.div
      className={`legend-panel legend-${position}`}
      initial={false}
      animate={{ 
        height: collapsed ? 44 : 'auto',
        opacity: 1,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      data-testid="legend-panel"
    >
      {/* Header */}
      <button 
        className="legend-header" 
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="legend-content"
      >
        <span className="legend-icon">📖</span>
        <span className="legend-title">Legend</span>
        <motion.span
          className="legend-chevron"
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            id="legend-content"
            className="legend-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Layers Section */}
            <LegendSection title="LAYERS">
              <LegendItem icon="⚡" label="Orchestration" desc="Conductor/Saga" />
              <LegendItem icon="📦" label="Domain" desc="Bounded Contexts" />
              <LegendItem icon="🔧" label="Infrastructure" desc="Bus/Database" />
            </LegendSection>

            {/* Nodes Section */}
            {showNodes && (
              <LegendSection title="NODES">
                {nodeTypes.map(node => (
                  <LegendItem
                    key={node.type}
                    icon={node.icon}
                    label={node.label}
                    desc={node.description}
                  />
                ))}
              </LegendSection>
            )}

            {/* Edges Section */}
            <LegendSection title="EDGES">
              {edgeTypes.map(edge => (
                <LegendEdgeItem
                  key={edge.type}
                  style={edge.style}
                  color={edge.color}
                  label={edge.label}
                  desc={edge.description}
                />
              ))}
            </LegendSection>

            {/* BC Colors */}
            {showBCs && (
              <LegendSection title="BOUNDED CONTEXTS">
                <div className="legend-bc-grid">
                  {boundedContexts.map(bc => (
                    <LegendBCItem
                      key={bc.id}
                      name={bc.name}
                      color={bc.color}
                    />
                  ))}
                </div>
              </LegendSection>
            )}

            {/* Keyboard hint */}
            <div className="legend-hint">
              Press <kbd>L</kbd> to toggle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Legend section with title
 */
function LegendSection({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="legend-section">
      <div className="legend-section-title">{title}</div>
      <div className="legend-section-content">{children}</div>
    </div>
  );
}

/**
 * Legend item with icon
 */
function LegendItem({ 
  icon, 
  label, 
  desc 
}: { 
  icon: string; 
  label: string; 
  desc: string;
}) {
  return (
    <div className="legend-item">
      <span className="legend-item-icon">{icon}</span>
      <span className="legend-item-label">{label}</span>
      <span className="legend-item-desc">{desc}</span>
    </div>
  );
}

/**
 * Legend edge item with line style
 */
function LegendEdgeItem({ 
  style, 
  color,
  label, 
  desc 
}: { 
  style: string;
  color: string;
  label: string; 
  desc: string;
}) {
  const getLineStyle = () => {
    switch (style) {
      case 'dashed':
        return { borderTop: `2px dashed ${color}` };
      case 'dotted':
        return { borderTop: `2px dotted ${color}` };
      case 'double':
        return { borderTop: `3px double ${color}` };
      default:
        return { borderTop: `2px solid ${color}` };
    }
  };

  return (
    <div className="legend-item legend-edge-item">
      <div className="legend-edge-line" style={getLineStyle()}>
        <span className="legend-edge-arrow">▶</span>
      </div>
      <span className="legend-item-label">{label}</span>
      <span className="legend-item-desc">{desc}</span>
    </div>
  );
}

/**
 * Legend BC color swatch
 */
function LegendBCItem({ 
  name, 
  color 
}: { 
  name: string; 
  color: string;
}) {
  return (
    <div className="legend-bc-item">
      <span 
        className="legend-bc-swatch" 
        style={{ backgroundColor: color }}
      />
      <span className="legend-bc-name">{name}</span>
    </div>
  );
}

export default LegendPanel;
