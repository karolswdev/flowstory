import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import type { MigrationRoadmapStory, MigrationRoadmapStep, Phase, Task } from '../../schemas/migration-roadmap';
import { STATUS_COLORS, STATUS_ICONS } from '../../schemas/migration-roadmap';
import './migration-roadmap.css';

interface MigrationRoadmapCanvasProps {
  story: MigrationRoadmapStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

function PhaseCard({ phase, tasks, isHighlighted, delay = 0 }: {
  phase: Phase;
  tasks: Task[];
  isHighlighted?: boolean;
  delay?: number;
}) {
  const color = STATUS_COLORS[phase.status] || '#666';
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  
  return (
    <motion.div
      className={`phase-card ${isHighlighted ? 'highlighted' : ''}`}
      variants={fadeUp}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={TRANSITION.default}
      transition={{ delay: delay / 1000 }}
      style={{ borderLeftColor: color }}
    >
      <div className="phase-header">
        <span className="phase-name">{phase.name}</span>
        <span className="phase-status" style={{ color }}>{phase.status}</span>
      </div>
      <div className="phase-dates">{phase.startDate} → {phase.endDate}</div>
      <div className="phase-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
        </div>
        <span>{completedTasks}/{tasks.length} tasks</span>
      </div>
      {tasks.slice(0, 3).map(task => (
        <div key={task.id} className={`task-item status-${task.status}`}>
          {STATUS_ICONS[task.status]} {task.name}
        </div>
      ))}
    </motion.div>
  );
}

export function MigrationRoadmapCanvas({ story, currentStepIndex, onStepChange }: MigrationRoadmapCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as MigrationRoadmapStep | undefined;
  
  const highlightedPhases = useMemo(() => 
    new Set(currentStep?.highlightPhases || []), [currentStep]);
  
  const phaseTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    story.phases.forEach(p => map[p.id] = []);
    story.tasks?.forEach(t => {
      if (map[t.phase]) map[t.phase].push(t);
    });
    return map;
  }, [story.phases, story.tasks]);
  
  return (
    <div className="migration-canvas">
      <h2>{story.title}</h2>
      
      <div className="phases-grid">
        {story.phases.map((phase, i) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            tasks={phaseTasks[phase.id] || []}
            isHighlighted={highlightedPhases.size === 0 || highlightedPhases.has(phase.id)}
            delay={i * 100}
          />
        ))}
      </div>
      
      {currentStep && (
        <motion.div className="migration-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={currentStepIndex}>
          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </motion.div>
      )}
      
      <div className="migration-nav">
        <button onClick={() => onStepChange?.(Math.max(0, currentStepIndex - 1))} disabled={currentStepIndex === 0}>← Previous</button>
        <span>{currentStepIndex + 1} / {story.steps.length}</span>
        <button onClick={() => onStepChange?.(Math.min(story.steps.length - 1, currentStepIndex + 1))} disabled={currentStepIndex >= story.steps.length - 1}>Next →</button>
      </div>
    </div>
  );
}

export default MigrationRoadmapCanvas;
