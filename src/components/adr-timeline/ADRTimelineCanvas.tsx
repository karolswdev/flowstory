import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ADRTimelineStory, ADRTimelineStep, ADR, Category } from '../../schemas/adr-timeline';
import { STATUS_STYLES, DEFAULT_CATEGORIES, ADR_TIMELINE_LAYOUT } from '../../schemas/adr-timeline';
import './adr-timeline.css';

interface ADRTimelineCanvasProps {
  story: ADRTimelineStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

const { cardWidth, cardHeight, cardGap } = ADR_TIMELINE_LAYOUT;

// ADR Card component
function ADRCard({ 
  adr, category, x, y, isHighlighted, isDimmed, isExpanded, delay = 0 
}: {
  adr: ADR;
  category?: Category;
  x: number;
  y: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  isExpanded?: boolean;
  delay?: number;
}) {
  const status = STATUS_STYLES[adr.status];
  const catColor = category?.color || '#666';
  
  return (
    <motion.g
      initial={{ opacity: 0, y: y - 20 }}
      animate={{ 
        opacity: isDimmed ? 0.3 : 1, 
        y,
        scale: isHighlighted ? 1.02 : 1,
      }}
      transition={{ delay: delay / 1000, type: 'spring', stiffness: 300 }}
    >
      {/* Card background */}
      <rect
        x={x}
        y={y}
        width={cardWidth}
        height={isExpanded ? cardHeight * 1.8 : cardHeight}
        rx={8}
        fill="var(--color-bg-elevated, #fff)"
        stroke={isHighlighted ? status.color : 'var(--color-border, #e0e0e0)'}
        strokeWidth={isHighlighted ? 2 : 1}
        filter={isHighlighted ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : undefined}
      />
      
      {/* Category stripe */}
      <rect
        x={x}
        y={y}
        width={6}
        height={isExpanded ? cardHeight * 1.8 : cardHeight}
        rx={3}
        fill={catColor}
      />
      
      {/* Status badge */}
      <circle
        cx={x + cardWidth - 20}
        cy={y + 20}
        r={10}
        fill={status.color}
      />
      <text
        x={x + cardWidth - 20}
        y={y + 24}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="bold"
      >
        {status.icon}
      </text>
      
      {/* ADR number */}
      <text x={x + 16} y={y + 22} className="adr-number">
        ADR-{adr.number}
      </text>
      
      {/* Title */}
      <text x={x + 16} y={y + 45} className="adr-title">
        {adr.title.length > 22 ? adr.title.slice(0, 20) + '...' : adr.title}
      </text>
      
      {/* Date */}
      <text x={x + 16} y={y + 65} className="adr-date">
        {adr.date}
      </text>
      
      {/* Status label */}
      <text x={x + 16} y={y + 85} className="adr-status" fill={status.color}>
        {status.label}
      </text>
      
      {/* Expanded content */}
      {isExpanded && adr.decision && (
        <foreignObject x={x + 12} y={y + 100} width={cardWidth - 24} height={70}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', overflow: 'hidden' }}>
            {adr.decision.slice(0, 150)}...
          </div>
        </foreignObject>
      )}
    </motion.g>
  );
}

/**
 * ADRTimelineCanvas - Architecture Decision Records timeline visualization
 */
export function ADRTimelineCanvas({ 
  story, 
  currentStepIndex,
  onStepChange 
}: ADRTimelineCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as ADRTimelineStep | undefined;
  const categories = story.categories || DEFAULT_CATEGORIES;
  
  // Sort ADRs by date and calculate positions
  const positionedADRs = useMemo(() => {
    const sorted = [...story.adrs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sorted.map((adr, index) => ({
      ...adr,
      x: 50 + index * (cardWidth + cardGap),
      y: 80,
      category: categories.find(c => c.id === adr.category),
    }));
  }, [story.adrs, categories]);
  
  // Filter and highlight based on current step
  const visibleADRs = useMemo(() => {
    let adrs = positionedADRs;
    
    if (currentStep?.filterCategory) {
      adrs = adrs.filter(a => a.category?.id === currentStep.filterCategory);
    }
    if (currentStep?.filterStatus) {
      adrs = adrs.filter(a => a.status === currentStep.filterStatus);
    }
    
    return adrs;
  }, [positionedADRs, currentStep]);
  
  const highlightedADRs = useMemo(() => 
    new Set(currentStep?.highlightADRs || []), [currentStep]);
  
  const expandedADR = currentStep?.expandADR;
  
  const viewWidth = Math.max(800, positionedADRs.length * (cardWidth + cardGap) + 100);
  const viewBox = `0 0 ${viewWidth} 280`;
  
  return (
    <div className="adr-timeline-canvas">
      <svg viewBox={viewBox} className="adr-timeline-svg">
        {/* Timeline axis */}
        <line
          x1={30}
          y1={60}
          x2={viewWidth - 30}
          y2={60}
          stroke="var(--color-border, #e0e0e0)"
          strokeWidth={2}
        />
        
        {/* Timeline markers */}
        {visibleADRs.map((adr, i) => (
          <g key={`marker-${adr.id}`}>
            <circle
              cx={adr.x + cardWidth / 2}
              cy={60}
              r={6}
              fill={STATUS_STYLES[adr.status].color}
            />
            <line
              x1={adr.x + cardWidth / 2}
              y1={66}
              x2={adr.x + cardWidth / 2}
              y2={80}
              stroke="var(--color-border, #e0e0e0)"
              strokeDasharray="3 3"
            />
          </g>
        ))}
        
        {/* Date labels */}
        {visibleADRs.map((adr, i) => (
          <text
            key={`date-${adr.id}`}
            x={adr.x + cardWidth / 2}
            y={45}
            textAnchor="middle"
            className="adr-timeline-date"
          >
            {new Date(adr.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          </text>
        ))}
        
        {/* ADR Cards */}
        <AnimatePresence>
          {visibleADRs.map((adr, index) => (
            <ADRCard
              key={adr.id}
              adr={adr}
              category={adr.category}
              x={adr.x}
              y={adr.y}
              isHighlighted={highlightedADRs.size === 0 || highlightedADRs.has(adr.id)}
              isDimmed={highlightedADRs.size > 0 && !highlightedADRs.has(adr.id)}
              isExpanded={expandedADR === adr.id}
              delay={index * 80}
            />
          ))}
        </AnimatePresence>
        
        {/* Supersedes relationships */}
        {currentStep?.showRelationships && visibleADRs.map(adr => {
          if (!adr.supersedes) return null;
          const target = visibleADRs.find(a => a.id === adr.supersedes);
          if (!target) return null;
          
          return (
            <motion.path
              key={`rel-${adr.id}-${target.id}`}
              d={`M ${adr.x + cardWidth / 2} ${adr.y + cardHeight} 
                  Q ${(adr.x + target.x + cardWidth) / 2} ${adr.y + cardHeight + 40}
                  ${target.x + cardWidth / 2} ${target.y + cardHeight}`}
              fill="none"
              stroke="#F44336"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="adr-legend">
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <span key={key} className="adr-legend-item">
            <span style={{ color: style.color }}>{style.icon}</span> {style.label}
          </span>
        ))}
      </div>
      
      {/* Info panel */}
      {currentStep && (
        <motion.div 
          className="adr-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStepIndex}
        >
          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </motion.div>
      )}
      
      {/* Navigation */}
      <div className="adr-nav">
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

export default ADRTimelineCanvas;
