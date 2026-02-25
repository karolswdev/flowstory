import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TechRadarStory, TechRadarStep, RingId, Technology } from '../../schemas/tech-radar';
import { DEFAULT_RINGS, DEFAULT_QUADRANTS, TECH_RADAR_LAYOUT } from '../../schemas/tech-radar';
import { TechBlip } from './TechBlip';
import { RadarRing } from './RadarRing';
import { QuadrantLabel } from './QuadrantLabel';
import { fadeUp, TRANSITION } from '../../animation';
import './tech-radar.css';

interface TechRadarCanvasProps {
  story: TechRadarStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

/**
 * Calculate blip position on the radar
 */
function calculateBlipPosition(
  tech: Technology,
  quadrants: typeof DEFAULT_QUADRANTS,
  ringIndex: number,
  blipIndex: number,
  totalBlipsInQuadrantRing: number
): { x: number; y: number } {
  const { radius, ringWidths } = TECH_RADAR_LAYOUT;
  
  // Find quadrant
  const quadrant = quadrants.find(q => q.id === tech.quadrant) || DEFAULT_QUADRANTS[0];
  const quadrantAngle = quadrant.angle * (Math.PI / 180);
  
  // Calculate ring boundaries
  const ringKeys: RingId[] = ['adopt', 'trial', 'assess', 'hold'];
  let innerRadius = 0;
  for (let i = 0; i < ringIndex; i++) {
    innerRadius += radius * ringWidths[ringKeys[i]];
  }
  const outerRadius = innerRadius + radius * ringWidths[ringKeys[ringIndex]];
  
  // Position within ring (spread across quadrant arc)
  const ringMidRadius = (innerRadius + outerRadius) / 2;
  const arcSpread = Math.PI / 4; // 45 degrees per quadrant
  const angleOffset = (blipIndex / (totalBlipsInQuadrantRing + 1) - 0.5) * arcSpread;
  const angle = quadrantAngle + angleOffset;
  
  // Add slight randomness to prevent overlaps
  const jitter = (Math.sin(blipIndex * 7) * 0.1 + 0.5) * (outerRadius - innerRadius) * 0.3;
  const r = ringMidRadius + jitter;
  
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
  };
}

/**
 * TechRadarCanvas - Main canvas for technology radar visualization
 */
export function TechRadarCanvas({
  story,
  currentStepIndex,
  onStepChange,
  hideOverlay = false,
}: TechRadarCanvasProps) {
  const quadrants = story.quadrants || DEFAULT_QUADRANTS;
  const rings = story.rings || DEFAULT_RINGS;
  const currentStep = story.steps[currentStepIndex] as TechRadarStep | undefined;
  
  // Calculate positions for all technologies
  const positionedTechs = useMemo(() => {
    const ringKeys: RingId[] = ['adopt', 'trial', 'assess', 'hold'];
    const ringIndex: Record<RingId, number> = { adopt: 0, trial: 1, assess: 2, hold: 3 };
    
    // Group techs by quadrant and ring
    const grouped: Record<string, Record<RingId, Technology[]>> = {};
    story.technologies.forEach(tech => {
      if (!grouped[tech.quadrant]) {
        grouped[tech.quadrant] = { adopt: [], trial: [], assess: [], hold: [] };
      }
      grouped[tech.quadrant][tech.ring].push(tech);
    });
    
    // Calculate positions
    return story.technologies.map(tech => {
      const quadrantTechs = grouped[tech.quadrant][tech.ring];
      const blipIndex = quadrantTechs.indexOf(tech);
      const pos = calculateBlipPosition(
        tech,
        quadrants,
        ringIndex[tech.ring],
        blipIndex,
        quadrantTechs.length
      );
      return { ...tech, position: pos };
    });
  }, [story.technologies, quadrants]);
  
  // Determine which techs are visible/highlighted
  const visibleTechs = useMemo(() => {
    if (!currentStep) return positionedTechs;
    
    return positionedTechs.filter(tech => {
      // Filter by ring focus
      if (currentStep.focusRing && tech.ring !== currentStep.focusRing) {
        return false;
      }
      // Filter by quadrant focus
      if (currentStep.focusQuadrant && tech.quadrant !== currentStep.focusQuadrant) {
        return false;
      }
      // Filter to only new
      if (currentStep.showNew && !tech.isNew) {
        return false;
      }
      // Filter to only moved
      if (currentStep.showMoved && tech.moved === 0) {
        return false;
      }
      return true;
    });
  }, [positionedTechs, currentStep]);
  
  const highlightedTechs = useMemo(() => {
    return new Set(currentStep?.highlightTech || []);
  }, [currentStep?.highlightTech]);
  
  const { radius } = TECH_RADAR_LAYOUT;
  const viewBox = `${-radius - 50} ${-radius - 50} ${(radius + 50) * 2} ${(radius + 50) * 2}`;
  
  return (
    <div className="tech-radar-canvas">
      <svg viewBox={viewBox} className="tech-radar-svg">
        {/* Rings */}
        {rings.map((ring, index) => {
          const isFocused = !currentStep?.focusRing || currentStep.focusRing === ring.id;
          
          return (
            <RadarRing
              key={ring.id}
              ring={ring}
              radius={radius}
              isDimmed={!isFocused}
              delay={index * 100}
            />
          );
        })}
        
        {/* Quadrant lines */}
        {quadrants.map(quadrant => {
          const angle = (quadrant.angle - 45) * (Math.PI / 180);
          const x2 = Math.cos(angle) * radius;
          const y2 = Math.sin(angle) * radius;
          return (
            <line
              key={`line-${quadrant.id}`}
              x1={0}
              y1={0}
              x2={x2}
              y2={y2}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}
        
        {/* Quadrant labels */}
        {quadrants.map((quadrant, index) => {
          const isFocused = !currentStep?.focusQuadrant || currentStep.focusQuadrant === quadrant.id;
          
          return (
            <QuadrantLabel
              key={quadrant.id}
              quadrant={quadrant}
              radius={radius}
              isDimmed={!isFocused}
              delay={index * 100}
            />
          );
        })}
        
        {/* Technology blips */}
        <AnimatePresence>
          {visibleTechs.map((tech, index) => (
            <TechBlip
              key={tech.id}
              tech={tech}
              x={tech.position.x}
              y={tech.position.y}
              isHighlighted={highlightedTechs.has(tech.id)}
              isDimmed={highlightedTechs.size > 0 && !highlightedTechs.has(tech.id)}
              delay={index * TECH_RADAR_LAYOUT.staggerDelay}
            />
          ))}
        </AnimatePresence>
      </svg>
      
      {!hideOverlay && (
        <>
          {/* Info panel for current step */}
          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                className="tech-radar-info"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={TRANSITION.default}
                key={currentStepIndex}
              >
                <h3>{currentStep.title}</h3>
                <p>{currentStep.description}</p>
                {currentStep.narration && (
                  <blockquote>
                    {currentStep.narration.speaker && <cite>{currentStep.narration.speaker}:</cite>}
                    {currentStep.narration.message}
                  </blockquote>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step navigation */}
          <div className="tech-radar-nav">
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
        </>
      )}
    </div>
  );
}

export default TechRadarCanvas;
