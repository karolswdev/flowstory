/**
 * RequestNode - Displays HTTP request details
 */

import { memo, useState } from 'react';
import { NodeHandles } from '../nodes/NodeHandles';
import { motion, AnimatePresence } from 'motion/react';
import type { RequestDef, HttpMethod } from '../../schemas/http-flow';
import { METHOD_COLORS } from '../../schemas/http-flow';
import './http-nodes.css';

interface RequestNodeProps {
  data: {
    request: RequestDef;
    isActive?: boolean;
    isComplete?: boolean;
  };
  selected?: boolean;
}

export const RequestNode = memo(function RequestNode({
  data,
  selected,
}: RequestNodeProps) {
  const { request, isActive, isComplete } = data;
  const [headersExpanded, setHeadersExpanded] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  const methodColor = METHOD_COLORS[request.method];
  const headerCount = request.headers ? Object.keys(request.headers).length : 0;
  const hasBody = request.body !== undefined;

  const stateClass = isActive ? 'node-active' : isComplete ? 'node-complete' : '';

  return (
    <motion.div
      className={`request-node ${stateClass} ${selected ? 'node-selected' : ''}`}
      data-testid="request-node"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Method and Path */}
      <div className="request-header">
        <span
          className="method-badge"
          style={{ backgroundColor: methodColor.bg, color: methodColor.text }}
        >
          {request.method}
        </span>
        <span className="request-path" title={request.url || request.path}>
          {request.path}
        </span>
      </div>

      {/* Headers Section */}
      {headerCount > 0 && (
        <div className="request-section">
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
                {Object.entries(request.headers!).map(([key, value]) => (
                  <div key={key} className="header-row">
                    <span className="header-key">{key}:</span>
                    <span className="header-value">
                      {key.toLowerCase() === 'authorization' ? '***' : value}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Body Section */}
      {hasBody && (
        <div className="request-section">
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
                  {typeof request.body === 'string'
                    ? request.body
                    : JSON.stringify(request.body, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <NodeHandles />
    </motion.div>
  );
});

export default RequestNode;
