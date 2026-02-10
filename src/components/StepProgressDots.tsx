import { motion } from 'motion/react';

interface StepProgressDotsProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

/**
 * Visual step progress indicator (dots)
 * 
 * Shows current position in step sequence with clickable dots
 */
export function StepProgressDots({ 
  currentStep, 
  totalSteps, 
  onStepClick 
}: StepProgressDotsProps) {
  if (totalSteps <= 1) return null;
  
  // For many steps, show compressed view
  const maxVisibleDots = 12;
  const showCompressed = totalSteps > maxVisibleDots;
  
  return (
    <div className="step-progress-dots">
      {showCompressed ? (
        // Compressed view: show first few, ellipsis, last few
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <Dot 
              key={i}
              index={i}
              isActive={currentStep === i}
              isVisited={currentStep > i}
              onClick={() => onStepClick?.(i)}
            />
          ))}
          <span className="step-progress-ellipsis">···</span>
          <span className="step-progress-counter">
            {currentStep + 1}/{totalSteps}
          </span>
          <span className="step-progress-ellipsis">···</span>
          {Array.from({ length: 2 }, (_, i) => {
            const stepIndex = totalSteps - 2 + i;
            return (
              <Dot 
                key={stepIndex}
                index={stepIndex}
                isActive={currentStep === stepIndex}
                isVisited={currentStep > stepIndex}
                onClick={() => onStepClick?.(stepIndex)}
              />
            );
          })}
        </>
      ) : (
        // Full view: show all dots
        Array.from({ length: totalSteps }, (_, i) => (
          <Dot 
            key={i}
            index={i}
            isActive={currentStep === i}
            isVisited={currentStep > i}
            onClick={() => onStepClick?.(i)}
          />
        ))
      )}
    </div>
  );
}

function Dot({ 
  index, 
  isActive, 
  isVisited, 
  onClick 
}: { 
  index: number;
  isActive: boolean;
  isVisited: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      className={`step-progress-dot ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.3 }}
      whileTap={{ scale: 0.9 }}
      initial={false}
      animate={{
        scale: isActive ? 1.25 : 1,
        backgroundColor: isActive 
          ? 'var(--color-primary)' 
          : isVisited 
            ? 'var(--color-text-secondary)' 
            : 'var(--color-text-muted)',
      }}
      transition={{ duration: 0.2 }}
      aria-label={`Go to step ${index + 1}`}
      aria-current={isActive ? 'step' : undefined}
    />
  );
}

export default StepProgressDots;
