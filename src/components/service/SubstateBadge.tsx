import { motion, AnimatePresence } from 'motion/react';
import { memo } from 'react';
import { getSubstateColor, SERVICE_TYPE_COLORS } from '../../schemas/service-flow';
import type { ServiceType } from '../../schemas/service-flow';

interface SubstateBadgeProps {
  substate: string | null | undefined;
  serviceType?: ServiceType;
}

/**
 * Animated pill badge showing a node's current sub-state.
 * Placed inside each node component. Crossfades text on change,
 * scales in/out on appear/disappear.
 */
export const SubstateBadge = memo(function SubstateBadge({ substate, serviceType }: SubstateBadgeProps) {
  const fallbackColor = serviceType ? SERVICE_TYPE_COLORS[serviceType] || '#9CA3AF' : '#9CA3AF';

  return (
    <AnimatePresence mode="wait">
      {substate && (
        <motion.span
          key={substate}
          className="substate-badge"
          style={{
            '--substate-color': getSubstateColor(substate, fallbackColor),
          } as React.CSSProperties}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {substate}
        </motion.span>
      )}
    </AnimatePresence>
  );
});

export default SubstateBadge;
