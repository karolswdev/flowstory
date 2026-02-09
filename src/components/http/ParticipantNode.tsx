/**
 * ParticipantNode - Represents a client, server, or service in HTTP flow
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Participant, ParticipantType } from '../../schemas/http-flow';
import './http-nodes.css';

const TYPE_ICONS: Record<ParticipantType, string> = {
  client: '🌐',
  server: '⚙️',
  service: '🔧',
  external: '🌍',
};

interface ParticipantNodeProps {
  data: {
    participant: Participant;
    isActive?: boolean;
  };
  selected?: boolean;
}

export const ParticipantNode = memo(function ParticipantNode({
  data,
  selected,
}: ParticipantNodeProps) {
  const { participant, isActive } = data;
  const icon = participant.icon || TYPE_ICONS[participant.type];

  return (
    <motion.div
      className={`participant-node participant-node--${participant.type} ${isActive ? 'participant-node--active' : ''} ${selected ? 'node-selected' : ''}`}
      data-testid="participant-node"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="participant-icon">{icon}</div>
      <div className="participant-name">{participant.name}</div>
      <div className="participant-type">{participant.type}</div>
      
      {/* Lifeline indicator */}
      <div className="participant-lifeline" />

      <Handle type="source" position={Position.Bottom} id="out" />
      <Handle type="target" position={Position.Top} id="in" />
    </motion.div>
  );
});

export default ParticipantNode;
