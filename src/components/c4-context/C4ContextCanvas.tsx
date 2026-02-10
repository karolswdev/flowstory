import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { C4ContextStory, C4ContextStep, C4Person, C4ExternalSystem, C4Relationship } from '../../schemas/c4-context';
import { C4_COLORS } from '../../schemas/c4-context';
import './c4-context.css';

interface C4ContextCanvasProps {
  story: C4ContextStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

interface PositionedElement {
  id: string;
  x: number;
  y: number;
  type: 'person' | 'system' | 'external';
  data: C4Person | typeof story.system | C4ExternalSystem;
}

/**
 * Calculate positions for C4 diagram elements
 */
function calculateLayout(story: C4ContextStory): PositionedElement[] {
  const elements: PositionedElement[] = [];
  const centerX = 400;
  const centerY = 300;
  
  // Central system
  elements.push({
    id: story.system.id,
    x: centerX,
    y: centerY,
    type: 'system',
    data: story.system,
  });
  
  // People at top
  const people = story.people || [];
  const peopleSpacing = 180;
  const peopleStartX = centerX - ((people.length - 1) * peopleSpacing) / 2;
  people.forEach((person, index) => {
    elements.push({
      id: person.id,
      x: peopleStartX + index * peopleSpacing,
      y: centerY - 180,
      type: 'person',
      data: person,
    });
  });
  
  // External systems around bottom/sides
  const externals = story.externalSystems || [];
  const angles = externals.map((_, i) => {
    const baseAngle = Math.PI * 0.55;
    const arcSpread = Math.PI * 0.9;
    return baseAngle + (i / Math.max(externals.length - 1, 1)) * arcSpread;
  });
  
  externals.forEach((ext, index) => {
    const radius = 220;
    const angle = angles[index] || Math.PI;
    elements.push({
      id: ext.id,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      type: 'external',
      data: ext,
    });
  });
  
  return elements;
}

// Simple SVG Person Node
function PersonNodeSVG({ person, x, y, isHighlighted, isDimmed, delay }: {
  person: C4Person;
  x: number;
  y: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}) {
  const color = person.external ? C4_COLORS.personExternal : C4_COLORS.person;
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
      transition={{ delay: (delay || 0) / 1000 }}
    >
      {/* Person icon (circle head + body) */}
      <circle cx={x} cy={y - 25} r={20} fill={color} />
      <path
        d={`M ${x - 25} ${y + 30} Q ${x} ${y - 5} ${x + 25} ${y + 30}`}
        fill={color}
      />
      {/* Name */}
      <text x={x} y={y + 50} textAnchor="middle" className="c4-node-name">
        {person.name}
      </text>
      {person.description && (
        <text x={x} y={y + 68} textAnchor="middle" className="c4-node-desc">
          {person.description}
        </text>
      )}
      {/* Highlight ring */}
      {isHighlighted && (
        <circle cx={x} cy={y} r={45} fill="none" stroke={color} strokeWidth={3} opacity={0.5} />
      )}
    </motion.g>
  );
}

// Simple SVG System Node (central box)
function SystemNodeSVG({ system, x, y, isHighlighted, isDimmed, delay }: {
  system: C4ContextStory['system'];
  x: number;
  y: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}) {
  const width = 160;
  const height = 100;
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
      transition={{ delay: (delay || 0) / 1000 }}
    >
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={8}
        fill={system.color || C4_COLORS.system}
        stroke={isHighlighted ? '#fff' : 'none'}
        strokeWidth={isHighlighted ? 3 : 0}
      />
      <text x={x} y={y - 10} textAnchor="middle" className="c4-system-name">
        {system.name}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" className="c4-system-desc">
        {system.description.slice(0, 30)}...
      </text>
    </motion.g>
  );
}

// Simple SVG External System Node (gray box)
function ExternalNodeSVG({ system, x, y, isHighlighted, isDimmed, delay }: {
  system: C4ExternalSystem;
  x: number;
  y: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}) {
  const width = 140;
  const height = 80;
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isDimmed ? 0.3 : 1, scale: 1 }}
      transition={{ delay: (delay || 0) / 1000 }}
    >
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={6}
        fill={C4_COLORS.externalSystem}
        stroke={isHighlighted ? '#fff' : 'none'}
        strokeWidth={isHighlighted ? 2 : 0}
      />
      <text x={x} y={y - 5} textAnchor="middle" className="c4-external-name">
        {system.name}
      </text>
      {system.description && (
        <text x={x} y={y + 15} textAnchor="middle" className="c4-external-desc">
          {system.description.slice(0, 25)}
        </text>
      )}
    </motion.g>
  );
}

/**
 * C4ContextCanvas - Main canvas for C4 Context diagram visualization
 */
export function C4ContextCanvas({ 
  story, 
  currentStepIndex,
  onStepChange 
}: C4ContextCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as C4ContextStep | undefined;
  
  const elements = useMemo(() => calculateLayout(story), [story]);
  
  const highlightedNodes = useMemo(() => {
    const set = new Set<string>();
    if (currentStep?.focusNode) set.add(currentStep.focusNode);
    currentStep?.highlightNodes?.forEach(id => set.add(id));
    return set;
  }, [currentStep]);
  
  const visibleRelationships = useMemo(() => {
    if (currentStep?.showRelationships) {
      return story.relationships.filter(r => 
        currentStep.showRelationships!.includes(r.id || `${r.from}-${r.to}`)
      );
    }
    if (currentStep?.filterRelationType) {
      return story.relationships.filter(r => r.type === currentStep.filterRelationType);
    }
    if (currentStep?.showCriticalPath) {
      return story.relationships.filter(r => r.critical);
    }
    return story.relationships;
  }, [story.relationships, currentStep]);
  
  const viewBox = "0 0 800 600";
  
  const getPosition = (id: string) => {
    const el = elements.find(e => e.id === id);
    return el ? { x: el.x, y: el.y } : { x: 400, y: 300 };
  };
  
  return (
    <div className="c4-context-canvas">
      <svg viewBox={viewBox} className="c4-context-svg">
        <defs>
          <marker id="c4-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={C4_COLORS.relationship} />
          </marker>
          <marker id="c4-arrow-critical" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={C4_COLORS.criticalPath} />
          </marker>
        </defs>
        
        {/* Relationships */}
        <g className="c4-relationships">
          {visibleRelationships.map((rel, index) => {
            const from = getPosition(rel.from);
            const to = getPosition(rel.to);
            const isCritical = rel.critical;
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            
            return (
              <motion.g
                key={rel.id || `${rel.from}-${rel.to}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <line
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={isCritical ? C4_COLORS.criticalPath : C4_COLORS.relationship}
                  strokeWidth={isCritical ? 2.5 : 1.5}
                  strokeDasharray={rel.sync === false ? "5 5" : undefined}
                  markerEnd={isCritical ? "url(#c4-arrow-critical)" : "url(#c4-arrow)"}
                />
                {rel.description && (
                  <text x={midX} y={midY - 8} textAnchor="middle" className="c4-rel-label">
                    {rel.description}
                  </text>
                )}
              </motion.g>
            );
          })}
        </g>
        
        {/* Elements */}
        <AnimatePresence>
          {elements.map((el, index) => {
            const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(el.id);
            const isDimmed = highlightedNodes.size > 0 && !highlightedNodes.has(el.id);
            
            if (el.type === 'person') {
              return (
                <PersonNodeSVG
                  key={el.id}
                  person={el.data as C4Person}
                  x={el.x}
                  y={el.y}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  delay={index * 100}
                />
              );
            } else if (el.type === 'system') {
              return (
                <SystemNodeSVG
                  key={el.id}
                  system={el.data as C4ContextStory['system']}
                  x={el.x}
                  y={el.y}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  delay={index * 100}
                />
              );
            } else {
              return (
                <ExternalNodeSVG
                  key={el.id}
                  system={el.data as C4ExternalSystem}
                  x={el.x}
                  y={el.y}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  delay={index * 100}
                />
              );
            }
          })}
        </AnimatePresence>
      </svg>
      
      {/* Info panel */}
      {currentStep && (
        <motion.div 
          className="c4-context-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStepIndex}
        >
          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </motion.div>
      )}
      
      {/* Navigation */}
      <div className="c4-context-nav">
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

export default C4ContextCanvas;
