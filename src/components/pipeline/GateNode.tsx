import { motion } from 'motion/react';
import { memo } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import type { GateDef, GateStatus, GateType } from '../../schemas/pipeline';
import { GATE_STATUS_COLORS } from '../../schemas/pipeline';

export interface GateNodeData extends GateDef {
  id: string;
  stageName?: string;
  isActive?: boolean;
  isComplete?: boolean;
}

interface GateNodeProps {
  data: GateNodeData;
  selected?: boolean;
}

const GATE_TYPE_ICONS: Record<GateType, string> = {
  approval: '👤',
  manual: '👆',
  scheduled: '⏰',
  condition: '🔀',
};

export const GateNode = memo(function GateNode({ data, selected }: GateNodeProps) {
  const {
    type,
    status,
    approvers,
    approvedBy,
    condition,
    isActive = false,
    isComplete = false,
  } = data;

  const statusColor = GATE_STATUS_COLORS[status as GateStatus] || '#FF9800';
  const icon = GATE_TYPE_ICONS[type as GateType] || '🔒';
  const stateClass = isActive ? 'active' : isComplete ? 'complete' : 'inactive';

  return (
    <motion.div
      className={`gate-node gate-node--${status} gate-node--${stateClass}`}
      data-state={stateClass}
      data-status={status}
      style={{ borderColor: statusColor, background: `${statusColor}10` }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: isActive ? `0 0 16px ${statusColor}60` : 'none',
      }}
      transition={{ duration: 0.25 }}
    >
      <NodeHandles />

      <div className="gate-node__header">
        <span className="gate-node__icon">{icon}</span>
        <span className="gate-node__type">{type}</span>
      </div>
      
      <div className="gate-node__status" style={{ color: statusColor }}>
        {status === 'pending' && '⏳ Waiting'}
        {status === 'approved' && `✅ ${approvedBy || 'Approved'}`}
        {status === 'rejected' && '❌ Rejected'}
        {status === 'skipped' && '⏭️ Skipped'}
      </div>
      
      {approvers && approvers.length > 0 && status === 'pending' && (
        <div className="gate-node__approvers">
          Awaiting: {approvers.join(', ')}
        </div>
      )}
      
      {condition && (
        <div className="gate-node__condition">
          {condition}
        </div>
      )}
      
    </motion.div>
  );
});

export default GateNode;
