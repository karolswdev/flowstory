import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import type { 
  EventStormingStory, 
  EventStormingStep, 
  DomainEvent, 
  Command, 
  Aggregate,
  Policy,
  Hotspot 
} from '../../schemas/event-storming';
import { ES_COLORS } from '../../schemas/event-storming';
import './event-storming.css';

interface EventStormingCanvasProps {
  story: EventStormingStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
}

// Sticky note dimensions
const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 80;
const NOTE_GAP = 24;

// SVG sticky note component
function StickyNote({
  x, y, color, title, subtitle, isHighlighted, isDimmed, delay = 0
}: {
  x: number;
  y: number;
  color: string;
  title: string;
  subtitle?: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  delay?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8, y: y - 20 }}
      animate={{
        opacity: isDimmed ? 0.25 : 1,
        scale: isHighlighted ? 1.08 : 1,
        y
      }}
      transition={{ delay: delay / 1000, type: 'spring', stiffness: 300 }}
      style={{ transformOrigin: `${x + NOTE_WIDTH / 2}px ${y + NOTE_HEIGHT / 2}px` }}
    >
      {/* Glow ring for highlighted notes */}
      {isHighlighted && (
        <motion.rect
          x={x - 6}
          y={y - 6}
          width={NOTE_WIDTH + 12}
          height={NOTE_HEIGHT + 12}
          fill="none"
          rx={8}
          stroke={color}
          strokeWidth={3}
          filter="url(#es-glow)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Shadow */}
      <rect
        x={x + 3}
        y={y + 3}
        width={NOTE_WIDTH}
        height={NOTE_HEIGHT}
        fill={isHighlighted ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'}
        rx={4}
      />
      {/* Note */}
      <rect
        x={x}
        y={y}
        width={NOTE_WIDTH}
        height={NOTE_HEIGHT}
        fill={color}
        rx={4}
        stroke={isHighlighted ? '#1a1a2e' : 'none'}
        strokeWidth={isHighlighted ? 2.5 : 0}
        filter={isHighlighted ? 'url(#es-glow)' : undefined}
      />
      {/* Title */}
      <text
        x={x + NOTE_WIDTH / 2}
        y={y + NOTE_HEIGHT / 2 - (subtitle ? 8 : 0)}
        textAnchor="middle"
        className="es-note-title"
        style={{ fontWeight: isHighlighted ? 700 : undefined }}
      >
        {title}
      </text>
      {/* Subtitle */}
      {subtitle && (
        <text
          x={x + NOTE_WIDTH / 2}
          y={y + NOTE_HEIGHT / 2 + 12}
          textAnchor="middle"
          className="es-note-subtitle"
        >
          {subtitle}
        </text>
      )}
    </motion.g>
  );
}

// Hotspot marker
function HotspotMarker({ x, y, note, type }: { x: number; y: number; note: string; type: string }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <circle cx={x} cy={y} r={15} fill={ES_COLORS.hotspot} />
      <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
        {type === 'question' ? '?' : type === 'problem' ? '!' : '⚠'}
      </text>
    </motion.g>
  );
}

/**
 * EventStormingCanvas - Main canvas for Event Storming visualization
 */
export function EventStormingCanvas({
  story,
  currentStepIndex,
  onStepChange,
  hideOverlay = false,
}: EventStormingCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as EventStormingStep | undefined;
  
  // Calculate positions for all elements
  const layout = useMemo(() => {
    const events = story.events || [];
    const commands = story.commands || [];
    const aggregates = story.aggregates || [];
    const policies = story.policies || [];
    
    // Timeline layout: events flow left to right
    const startX = 50;
    const eventY = 200;
    const commandY = 100;
    const aggregateY = 320;
    
    const eventPositions = events.map((e, i) => ({
      ...e,
      x: startX + i * (NOTE_WIDTH + NOTE_GAP),
      y: eventY,
    }));
    
    // Commands above their triggered events
    const commandPositions = commands.map((c) => {
      const triggerEvent = events.findIndex(e => c.produces?.includes(e.id));
      const x = triggerEvent >= 0 
        ? startX + triggerEvent * (NOTE_WIDTH + NOTE_GAP)
        : startX + commands.indexOf(c) * (NOTE_WIDTH + NOTE_GAP);
      return { ...c, x, y: commandY };
    });
    
    // Aggregates below events
    const aggregatePositions = aggregates.map((a, i) => ({
      ...a,
      x: startX + i * (NOTE_WIDTH * 1.5 + NOTE_GAP),
      y: aggregateY,
    }));
    
    // Policies to the right
    const policyPositions = policies.map((p, i) => ({
      ...p,
      x: startX + events.length * (NOTE_WIDTH + NOTE_GAP) + 50,
      y: eventY + i * (NOTE_HEIGHT + NOTE_GAP / 2),
    }));
    
    return { eventPositions, commandPositions, aggregatePositions, policyPositions };
  }, [story]);
  
  // Determine highlighted elements
  const highlightedEvents = useMemo(() => 
    new Set(currentStep?.highlightEvents || []), [currentStep]);
  const highlightedCommands = useMemo(() => 
    new Set(currentStep?.highlightCommands || []), [currentStep]);
  
  // Filter by aggregate if specified
  const focusAggregate = currentStep?.focusAggregate;
  
  // Canvas dimensions — generous padding around all elements
  const CANVAS_PAD = 200;
  const viewWidth = Math.max(1200, layout.eventPositions.length * (NOTE_WIDTH + NOTE_GAP) + CANVAS_PAD * 2);
  const viewHeight = 900;

  // Zoom and pan state — initial view offset so content is centered with breathing room
  const [viewBox, setViewBox] = useState({ x: -CANVAS_PAD, y: -CANVAS_PAD / 2, w: viewWidth, h: viewHeight });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number; vbX: number; vbY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset viewBox when layout changes
  const prevViewWidth = useRef(viewWidth);
  if (prevViewWidth.current !== viewWidth) {
    prevViewWidth.current = viewWidth;
    setViewBox({ x: -CANVAS_PAD, y: -CANVAS_PAD / 2, w: viewWidth, h: viewHeight });
  }

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    return {
      x: viewBox.x + (clientX - rect.left) * scaleX,
      y: viewBox.y + (clientY - rect.top) * scaleY,
    };
  }, [viewBox]);

  // Zoom: Ctrl/Cmd+scroll to zoom, plain scroll passes through to page
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    if (!e.ctrlKey && !e.metaKey) return; // Let normal scroll bubble to page
    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = prev.w * zoomFactor;
      const newH = prev.h * zoomFactor;
      // Clamp: min zoom shows 2x canvas (zoomed way out), max zoom is 3x detail
      const minW = viewWidth * 2;
      const minH = viewHeight * 2;
      const maxW = viewWidth / 3;
      const maxH = viewHeight / 3;
      const clampedW = Math.max(maxW, Math.min(minW, newW));
      const clampedH = Math.max(maxH, Math.min(minH, newH));
      // Zoom centered on cursor
      const cursor = screenToSvg(e.clientX, e.clientY);
      const ratioW = clampedW / prev.w;
      const ratioH = clampedH / prev.h;
      const newX = cursor.x - (cursor.x - prev.x) * ratioW;
      const newY = cursor.y - (cursor.y - prev.y) * ratioH;
      return { x: newX, y: newY, w: clampedW, h: clampedH };
    });
  }, [viewWidth, viewHeight, screenToSvg]);

  // Pan: drag to move the viewBox origin
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    // Only pan on primary button (left click)
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, vbX: viewBox.x, vbY: viewBox.y };
  }, [viewBox.x, viewBox.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || !panStart.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.current.x) * scaleX;
    const dy = (e.clientY - panStart.current.y) * scaleY;
    setViewBox(prev => ({
      ...prev,
      x: panStart.current!.vbX - dx,
      y: panStart.current!.vbY - dy,
    }));
  }, [isPanning, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

  // Controls hint — show on mount, auto-dismiss after 4 seconds
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="es-canvas">
      {/* Controls hint overlay */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            className="es-controls-hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowHint(false)}
          >
            <span className="es-hint-key">{navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'} + Scroll</span> to zoom
            <span className="es-hint-sep">|</span>
            <span className="es-hint-key">Drag</span> to pan
          </motion.div>
        )}
      </AnimatePresence>
      <svg
        ref={svgRef}
        viewBox={viewBoxStr}
        className={`es-svg${isPanning ? ' es-svg--panning' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Timeline line */}
        <line
          x1={30}
          y1={240}
          x2={viewWidth - 30}
          y2={240}
          stroke={ES_COLORS.timeline}
          strokeWidth={2}
          strokeDasharray="8 4"
        />
        <text x={30} y={260} className="es-timeline-label">Timeline →</text>
        
        {/* Commands (blue) */}
        <g className="es-commands">
          {layout.commandPositions.map((cmd, i) => (
            <StickyNote
              key={cmd.id}
              x={cmd.x}
              y={cmd.y}
              color={ES_COLORS.command}
              title={cmd.name}
              subtitle={cmd.actor ? `by ${cmd.actor}` : undefined}
              isHighlighted={highlightedCommands.has(cmd.id)}
              isDimmed={focusAggregate && cmd.aggregate !== focusAggregate}
              delay={i * 50}
            />
          ))}
        </g>
        
        {/* Domain Events (orange) */}
        <g className="es-events">
          {layout.eventPositions.map((event, i) => (
            <StickyNote
              key={event.id}
              x={event.x}
              y={event.y}
              color={ES_COLORS.domainEvent}
              title={event.name}
              subtitle={event.aggregate}
              isHighlighted={highlightedEvents.has(event.id)}
              isDimmed={focusAggregate && event.aggregate !== focusAggregate}
              delay={i * 50 + 100}
            />
          ))}
        </g>
        
        {/* Aggregates (yellow) */}
        <g className="es-aggregates">
          {layout.aggregatePositions.map((agg, i) => (
            <StickyNote
              key={agg.id}
              x={agg.x}
              y={agg.y}
              color={ES_COLORS.aggregate}
              title={agg.name}
              subtitle="Aggregate"
              isHighlighted={focusAggregate === agg.id}
              delay={i * 50 + 200}
            />
          ))}
        </g>
        
        {/* Policies (lilac) - if enabled */}
        {currentStep?.showPolicies && (
          <g className="es-policies">
            {layout.policyPositions.map((policy, i) => (
              <StickyNote
                key={policy.id}
                x={policy.x}
                y={policy.y}
                color={ES_COLORS.policy}
                title={policy.name}
                subtitle="Policy"
                delay={i * 50 + 300}
              />
            ))}
          </g>
        )}
        
        {/* Hotspots - if enabled */}
        {currentStep?.showHotspots && story.hotspots?.map((hotspot, i) => {
          const nearElement = layout.eventPositions.find(e => e.id === hotspot.near);
          const x = nearElement ? nearElement.x + NOTE_WIDTH + 10 : 100 + i * 50;
          const y = nearElement ? nearElement.y : 150;
          return (
            <HotspotMarker
              key={hotspot.id}
              x={x}
              y={y}
              note={hotspot.note}
              type={hotspot.type}
            />
          );
        })}
        
        {/* Arrows from commands to events */}
        {layout.commandPositions.map(cmd => {
          const targetEvent = layout.eventPositions.find(e => cmd.produces?.includes(e.id));
          if (!targetEvent) return null;
          return (
            <motion.line
              key={`arrow-${cmd.id}`}
              x1={cmd.x + NOTE_WIDTH / 2}
              y1={cmd.y + NOTE_HEIGHT}
              x2={targetEvent.x + NOTE_WIDTH / 2}
              y2={targetEvent.y}
              stroke="#666"
              strokeWidth={1.5}
              markerEnd="url(#es-arrow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          );
        })}
        
        <defs>
          <marker id="es-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#666" />
          </marker>
          {/* Glow filter for highlighted sticky notes */}
          <filter id="es-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" type="saturate" values="2" result="saturated" />
            <feMerge>
              <feMergeNode in="saturated" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {!hideOverlay && (
        <>
          {/* Info panel */}
          <AnimatePresence mode="wait">
            {currentStep && (
              <motion.div
                className="es-info"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={TRANSITION.default}
                key={currentStepIndex}
              >
                <h3>{currentStep.title}</h3>
                <p>{currentStep.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="es-nav">
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

export default EventStormingCanvas;
