/**
 * ResponseNode - Displays HTTP response details
 */

import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import type { ResponseDef, TimingDef } from '../../schemas/http-flow';
import { getStatusColor, getStatusText } from '../../schemas/http-flow';
import './http-nodes.css';

interface ResponseNodeProps {
  data: {
    response: ResponseDef;
    timing?: TimingDef;
    isActive?: boolean;
    isComplete?: boolean;
  };
  selected?: boolean;
}

export const ResponseNode = memo(function ResponseNode({
  data,
  selected,
}: ResponseNodeProps) {
  const { response, timing, isActive, isComplete } = data;
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(true); // Body expanded by default

  const statusColor = getStatusColor(response.status);
  const statusText = response.statusText || getStatusText(response.status);
  const headerCount = response.headers ? Object.keys(response.headers).length : 0;
  const hasBody = response.body !== undefined;

  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`response-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="response-node"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status and Timing */}
      <div className="response-header">
        <span
          className="status-badge"
          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
        >
          {response.status}
        </span>
        <span className="status-text">{statusText}</span>
        {timing && (
          <span className="timing-badge">{timing.total}ms</span>
        )}
      </div>

      {/* Headers Section */}
      {headerCount > 0 && (
        <div className="response-section">
          <button
            className="section-toggle"
            onClick={() => setHeadersExpanded(!headersExpanded)}
          >
            <span>{headersExpanded ? '▼' : '▶'}</span>
            <span>Headers ({headerCount})</span>
          </button>
          <AnimatePresence>
            {headersExpanded && (
              <motion.div
                className="section-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {Object.entries(response.headers!).map(([key, value]) => (
                  <div key={key} className="header-row">
                    <span className="header-key">{key}:</span>
                    <span className="header-value">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Body Section */}
      {hasBody && (
        <div className="response-section">
          <button
            className="section-toggle"
            onClick={() => setBodyExpanded(!bodyExpanded)}
          >
            <span>{bodyExpanded ? '▼' : '▶'}</span>
            <span>Body</span>
          </button>
          <AnimatePresence>
            {bodyExpanded && (
              <motion.div
                className="section-content body-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <pre className="body-json">
                  {typeof response.body === 'string'
                    ? response.body
                    : JSON.stringify(response.body, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Redirect indicator */}
      {response.redirect && (
        <div className="redirect-indicator">
          <span>↪️ {response.redirect.type}: {response.redirect.location}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Left} id="in" />
    </motion.div>
  );
});

export default ResponseNode;
