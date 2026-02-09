/**
 * EdgeMarkers - SVG marker definitions for edge arrow heads
 * Must be rendered inside the ReactFlow component
 */
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Flow edge marker - green arrow */}
        <marker
          id="arrow-flow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#4CAF50" />
        </marker>

        {/* Event edge marker - amber arrow */}
        <marker
          id="arrow-event"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFC107" />
        </marker>

        {/* Error edge marker - red arrow */}
        <marker
          id="arrow-error"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#F44336" />
        </marker>

        {/* Async edge marker - purple arrow */}
        <marker
          id="arrow-async"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#9C27B0" />
        </marker>
      </defs>
    </svg>
  );
}
