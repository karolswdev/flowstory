import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BaseCanvas } from '../base';
import type { DependencyGraphStory, DependencyGraphStep, ServiceNode } from '../../schemas/dependency-graph';
import { HEALTH_COLORS } from '../../schemas/dependency-graph';

// Service type colors
const SERVICE_COLORS: Record<string, string> = {
  service: '#2196F3',
  database: '#4CAF50',
  cache: '#FF9800',
  queue: '#9C27B0',
  external: '#607D8B',
  gateway: '#00BCD4',
  cdn: '#795548',
  storage: '#009688',
};
import './dependency-graph.css';

interface DependencyGraphCanvasProps {
  story: DependencyGraphStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

const NODE_SIZE = 80;
const RADIUS = 200;

function ServiceNodeSVG({ node, x, y, isHighlighted, isDimmed, delay = 0 }: {
  node: ServiceNode;
  x: number;
  y: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}) {
  const color = SERVICE_COLORS[node.type] || '#666';
  const healthColor = HEALTH_COLORS[node.health || 'unknown'];
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
      transition={{ delay: delay / 1000 }}
    >
      <circle cx={x} cy={y} r={NODE_SIZE / 2} fill={color} stroke={isHighlighted ? '#333' : 'none'} strokeWidth={2} />
      <circle cx={x + 25} cy={y - 25} r={8} fill={healthColor} stroke="white" strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
        {node.name.length > 10 ? node.name.slice(0, 8) + '...' : node.name}
      </text>
      {node.uptime !== undefined && (
        <text x={x} y={y + 55} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">
          {node.uptime.toFixed(1)}%
        </text>
      )}
    </motion.g>
  );
}

export function DependencyGraphCanvas({ story, currentStepIndex, onStepChange, hideOverlay = false }: DependencyGraphCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as DependencyGraphStep | undefined;
  
  const layout = useMemo(() => {
    const nodes = story.services;
    const centerX = 400;
    const centerY = 250;
    
    return nodes.map((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      return {
        ...node,
        x: centerX + Math.cos(angle) * RADIUS,
        y: centerY + Math.sin(angle) * RADIUS,
      };
    });
  }, [story.services]);
  
  const highlightedServices = useMemo(() => 
    new Set(currentStep?.highlightServices || []), [currentStep]);
  
  const viewBox = "0 0 800 500";
  
  return (
    <BaseCanvas
      className="dep-graph-canvas"
      currentStepIndex={currentStepIndex}
      totalSteps={story.steps.length}
      stepTitle={currentStep?.title}
      stepDescription={currentStep?.description}
      onStepChange={onStepChange}
      showInfo={!hideOverlay}
      showNav={!hideOverlay}
      infoClassName="dep-info"
      navClassName="dep-nav"
    >
      <svg viewBox={viewBox} className="dep-graph-svg">
        {/* Dependencies (edges) */}
        {story.dependencies?.map((dep, i) => {
          const from = layout.find(n => n.id === dep.from);
          const to = layout.find(n => n.id === dep.to);
          if (!from || !to) return null;
          
          return (
            <motion.line
              key={`dep-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={dep.critical ? '#F44336' : 'var(--color-border)'}
              strokeWidth={dep.critical ? 2 : 1}
              strokeDasharray={dep.async ? '5 5' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          );
        })}
        
        {/* Service nodes */}
        <AnimatePresence>
          {layout.map((node, i) => (
            <ServiceNodeSVG
              key={node.id}
              node={node}
              x={node.x}
              y={node.y}
              isHighlighted={highlightedServices.size === 0 || highlightedServices.has(node.id)}
              isDimmed={highlightedServices.size > 0 && !highlightedServices.has(node.id)}
              delay={i * 80}
            />
          ))}
        </AnimatePresence>
      </svg>
    </BaseCanvas>
  );
}

export default DependencyGraphCanvas;
