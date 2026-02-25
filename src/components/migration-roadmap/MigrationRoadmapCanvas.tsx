import { useMemo } from 'react';
import { motion } from 'motion/react';
import { fadeUp, TRANSITION } from '../../animation';
import { BaseCanvas } from '../base';
import type { MigrationRoadmapStory, MigrationRoadmapStep, Phase, Task } from '../../schemas/migration-roadmap';
import { STATUS_COLORS, STATUS_ICONS } from '../../schemas/migration-roadmap';
import './migration-roadmap.css';

interface MigrationRoadmapCanvasProps {
  story: MigrationRoadmapStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
  hideOverlay?: boolean;
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

export function MigrationRoadmapCanvas({ story, currentStepIndex, onStepChange, hideOverlay = false }: MigrationRoadmapCanvasProps) {
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
    <BaseCanvas
      className="migration-canvas"
      currentStepIndex={currentStepIndex}
      totalSteps={story.steps.length}
      stepTitle={currentStep?.title}
      stepDescription={currentStep?.description}
      onStepChange={onStepChange}
      showInfo={!hideOverlay}
      showNav={!hideOverlay}
      infoClassName="migration-info"
      navClassName="migration-nav"
    >
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
    </BaseCanvas>
  );
}

export default MigrationRoadmapCanvas;
