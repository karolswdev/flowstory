import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';
import type { ArtifactType, ChildArtifact } from '../../schemas/bc-deployment';
import { ARTIFACT_ICONS, ARTIFACT_COLORS } from '../../schemas/bc-deployment';
import './bc-deployment.css';

interface ChildArtifactNodeData extends ChildArtifact {
  isActive?: boolean;
  isComplete?: boolean;
  enterDelay?: number;
  parentId?: string;
}

interface ChildArtifactNodeProps {
  data: ChildArtifactNodeData;
  selected?: boolean;
}

/**
 * ChildArtifactNode - Smaller node for artifacts nested within parent artifacts
 * Shows icon and name in compact form
 */
export const ChildArtifactNode = memo(function ChildArtifactNode({ 
  data, 
  selected 
}: ChildArtifactNodeProps) {
  const { 
    type: artifactType, 
    name, 
    description,
    annotations,
    isActive, 
    isComplete,
    enterDelay = 0 
  } = data;

  const icon = ARTIFACT_ICONS[artifactType];
  const color = ARTIFACT_COLORS[artifactType];
  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`child-artifact-node artifact-${artifactType} ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="child-artifact-node"
      data-artifact-type={artifactType}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        boxShadow: isActive 
          ? `0 0 16px ${color}60`
          : '0 2px 8px rgba(0,0,0,0.1)'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        delay: enterDelay / 1000
      }}
      style={{
        '--artifact-color': color,
        borderColor: color,
      } as React.CSSProperties}
      title={description || `${name} (${artifactType})`}
    >
      {/* Icon */}
      <span className="child-artifact-icon">{icon}</span>
      
      {/* Name */}
      <span className="child-artifact-name">{name}</span>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="child-handle" />
      <Handle type="source" position={Position.Right} className="child-handle" />
    </motion.div>
  );
});

export default ChildArtifactNode;
