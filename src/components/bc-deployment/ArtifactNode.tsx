import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { ArtifactType } from '../../schemas/bc-deployment';
import { ARTIFACT_ICONS, ARTIFACT_COLORS } from '../../schemas/bc-deployment';
import './bc-deployment.css';

interface ArtifactNodeData {
  id: string;
  artifactType: ArtifactType;
  name: string;
  path?: string;
  description?: string;
  highlights?: Array<{ key: string; value: string }>;
  isActive?: boolean;
  isComplete?: boolean;
  /** Delay for staggered entrance */
  enterDelay?: number;
}

interface ArtifactNodeProps {
  data: ArtifactNodeData;
  selected?: boolean;
}

/**
 * ArtifactNode - K8s/Helm resource node
 * Shows icon, name, and expandable details on focus
 */
export const ArtifactNode = memo(function ArtifactNode({ data, selected }: ArtifactNodeProps) {
  const { 
    artifactType, 
    name, 
    path, 
    description, 
    highlights,
    isActive, 
    isComplete,
    enterDelay = 0 
  } = data;

  const [showDetails, setShowDetails] = useState(false);
  const icon = ARTIFACT_ICONS[artifactType];
  const color = ARTIFACT_COLORS[artifactType];
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`artifact-node artifact-${artifactType} ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="artifact-node"
      data-artifact-type={artifactType}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: 0,
        boxShadow: isActive 
          ? `0 0 24px ${color}60`
          : '0 4px 16px rgba(0,0,0,0.1)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        delay: enterDelay / 1000
      }}
      style={{
        '--artifact-color': color,
        borderColor: color,
      } as React.CSSProperties}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Icon badge */}
      <motion.div 
        className="artifact-icon"
        animate={isActive ? { 
          scale: [1, 1.15, 1],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {icon}
      </motion.div>

      {/* Name */}
      <div className="artifact-name" title={name}>{name}</div>

      {/* Path (if available) */}
      {path && (
        <div className="artifact-path" title={path}>
          {path.length > 25 ? `...${path.slice(-22)}` : path}
        </div>
      )}

      {/* Expanded details on hover/active */}
      <AnimatePresence>
        {(showDetails || isActive) && (description || highlights?.length) && (
          <motion.div
            className="artifact-details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {description && (
              <p className="artifact-description">{description}</p>
            )}
            
            {highlights && highlights.length > 0 && (
              <div className="artifact-highlights">
                {highlights.map((h, i) => (
                  <div key={i} className="artifact-highlight">
                    <span className="highlight-key">{h.key}:</span>
                    <span className="highlight-value">{h.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type label */}
      <div className="artifact-type-label">
        {artifactType.replace('-', ' ')}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="artifact-handle" />
      <Handle type="source" position={Position.Right} className="artifact-handle" />
      <Handle type="target" position={Position.Top} className="artifact-handle" />
      <Handle type="source" position={Position.Bottom} className="artifact-handle" />
    </motion.div>
  );
});

export default ArtifactNode;
