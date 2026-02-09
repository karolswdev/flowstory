import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { StageDef, GateDef } from '../../schemas/pipeline';
import { GATE_STATUS_COLORS } from '../../schemas/pipeline';

export interface StageNodeData extends StageDef {
  isActive?: boolean;
  isComplete?: boolean;
}

interface StageNodeProps {
  data: StageNodeData;
  selected?: boolean;
}

const GateIndicator = ({ gate }: { gate: GateDef }) => {
  const color = GATE_STATUS_COLORS[gate.status];
  const icon = gate.type === 'approval' ? '👤' : gate.type === 'scheduled' ? '⏰' : '🔒';
  
  return (
    <div className="stage-gate" style={{ borderColor: color }}>
      <span className="stage-gate__icon">{icon}</span>
      <span className="stage-gate__status" style={{ color }}>{gate.status}</span>
    </div>
  );
};

export const StageNode = memo(function StageNode({ data, selected }: StageNodeProps) {
  const {
    name,
    environment,
    gate,
    isActive = false,
    isComplete = false,
  } = data;

  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`stage-node stage-node--${stateClass}`}
      data-state={stateClass}
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: isActive ? '0 0 16px rgba(33, 150, 243, 0.4)' : 'none',
      }}
      transition={{ duration: 0.2 }}
    >
      <Handle type="target" position={Position.Left} className="stage-handle" />
      
      <div className="stage-node__header">
        <span className="stage-node__name">{name}</span>
        {environment && (
          <span className="stage-node__env">🌍 {environment}</span>
        )}
      </div>
      
      {gate && <GateIndicator gate={gate} />}
      
      <div className="stage-node__jobs">
        {/* Jobs are rendered as children */}
      </div>
      
      <Handle type="source" position={Position.Right} className="stage-handle" />
    </motion.div>
  );
});

export default StageNode;
