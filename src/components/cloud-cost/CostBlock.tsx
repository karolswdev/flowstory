import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import type { Resource, Category } from '../../schemas/cloud-cost';
import { 
  formatCurrency,
  CATEGORY_COLORS,
  TREND_COLORS,
  TREND_ICONS,
} from '../../schemas/cloud-cost';
import './cloud-cost.css';

interface CostBlockData extends Partial<Resource>, Partial<Category> {
  isCategory?: boolean;
  isActive?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

/**
 * CostBlock - Treemap block for cost visualization
 */
export const CostBlock = memo(function CostBlock({ 
  data,
  selected,
}: NodeProps<CostBlockData>) {
  const { 
    name,
    spend = 0,
    budget,
    trend,
    trendPct,
    team,
    optimize,
    isCategory,
    category,
    isActive,
    isHighlighted,
    isDimmed,
  } = data;

  const categoryKey = (isCategory ? data.category : category) as keyof typeof CATEGORY_COLORS;
  const bgColor = CATEGORY_COLORS[categoryKey] || '#9E9E9E';
  const trendColor = trend ? TREND_COLORS[trend] : undefined;
  const trendIcon = trend ? TREND_ICONS[trend] : undefined;
  
  const overBudget = budget && spend > budget;
  
  const stateClass = isActive ? 'cc-active' : 
                     isHighlighted ? 'cc-highlighted' :
                     isDimmed ? 'cc-dimmed' : '';

  return (
    <motion.div
      className={`cc-block ${isCategory ? 'cc-category' : 'cc-resource'} ${stateClass} ${selected ? 'node-selected' : ''}`}
      style={{ 
        '--block-color': bgColor,
        '--block-color-light': `${bgColor}22`,
      } as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: isDimmed ? 0.4 : 1, 
        scale: 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      data-testid="cost-block"
    >
      {/* Category bar */}
      <div className="cc-color-bar" style={{ backgroundColor: bgColor }} />

      {/* Name */}
      <div className="cc-name">{name}</div>

      {/* Spend */}
      <div className={`cc-spend ${overBudget ? 'cc-over-budget' : ''}`}>
        {formatCurrency(spend)}
      </div>

      {/* Budget comparison */}
      {budget && (
        <div className="cc-budget">
          / {formatCurrency(budget)}
          {overBudget && <span className="cc-over">⚠️</span>}
        </div>
      )}

      {/* Trend indicator */}
      {trend && trend !== 'stable' && (
        <div className="cc-trend" style={{ color: trendColor }}>
          {trendIcon} {trendPct}%
        </div>
      )}

      {/* Team */}
      {team && (
        <div className="cc-team">@{team}</div>
      )}

      {/* Optimization flag */}
      {optimize && (
        <div className="cc-optimize">💡 Optimize</div>
      )}

      <Handle type="target" position={Position.Top} className="cc-handle" />
      <Handle type="source" position={Position.Bottom} className="cc-handle" />
    </motion.div>
  );
});
