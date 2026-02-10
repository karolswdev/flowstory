import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { CloudCostStory, CloudCostStep, Category as CostCategory, Resource } from '../../schemas/cloud-cost';
import { CATEGORY_COLORS, TREND_ICONS } from '../../schemas/cloud-cost';
import './cloud-cost.css';

interface CloudCostCanvasProps {
  story: CloudCostStory;
  currentStepIndex: number;
  onStepChange?: (step: number) => void;
}

const formatCurrency = (n: number) => 
  n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

function CostBar({ category, maxSpend, delay = 0 }: {
  category: CostCategory;
  maxSpend: number;
  delay?: number;
}) {
  const width = (category.spend / maxSpend) * 300;
  const budgetWidth = category.budget ? (category.budget / maxSpend) * 300 : 0;
  const overBudget = category.budget && category.spend > category.budget;
  const color = CATEGORY_COLORS[category.category as keyof typeof CATEGORY_COLORS] || '#666';
  
  return (
    <motion.div 
      className="cost-bar-row"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="cost-bar-label">{category.name}</div>
      <div className="cost-bar-container">
        {budgetWidth > 0 && (
          <div className="cost-bar-budget" style={{ width: budgetWidth }} />
        )}
        <motion.div 
          className={`cost-bar-fill ${overBudget ? 'over-budget' : ''}`}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.5, delay: delay / 1000 }}
        />
      </div>
      <div className="cost-bar-value">{formatCurrency(category.spend)}</div>
    </motion.div>
  );
}

function ResourceCard({ resource, isHighlighted, delay = 0 }: {
  resource: Resource;
  isHighlighted?: boolean;
  delay?: number;
}) {
  const trend = TREND_ICONS[resource.trend];
  
  return (
    <motion.div 
      className={`resource-card ${isHighlighted ? 'highlighted' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay / 1000 }}
    >
      <div className="resource-name">{resource.name}</div>
      <div className="resource-spend">{formatCurrency(resource.spend)}</div>
      <div className={`resource-trend trend-${resource.trend}`}>
        {trend.icon} {resource.trendPercent ? `${resource.trendPercent}%` : ''}
      </div>
    </motion.div>
  );
}

export function CloudCostCanvas({ 
  story, 
  currentStepIndex,
  onStepChange 
}: CloudCostCanvasProps) {
  const currentStep = story.steps[currentStepIndex] as CloudCostStep | undefined;
  
  const maxSpend = useMemo(() => 
    Math.max(...story.categories.map(c => c.spend), 1), [story.categories]);
  
  const visibleCategories = useMemo(() => {
    if (currentStep?.focusCategory) {
      return story.categories.filter(c => c.id === currentStep.focusCategory);
    }
    return story.categories;
  }, [story.categories, currentStep]);
  
  const visibleResources = useMemo(() => {
    if (!story.resources) return [];
    if (currentStep?.focusCategory) {
      return story.resources.filter(r => r.category === currentStep.focusCategory);
    }
    return story.resources.slice(0, 6);
  }, [story.resources, currentStep]);
  
  const totalSpend = story.categories.reduce((sum, c) => sum + c.spend, 0);
  const totalBudget = story.categories.reduce((sum, c) => sum + (c.budget || 0), 0);
  
  return (
    <div className="cloud-cost-canvas">
      {/* Header */}
      <div className="cost-header">
        <h2>{story.title}</h2>
        <div className="cost-totals">
          <span className="total-spend">{formatCurrency(totalSpend)}</span>
          {totalBudget > 0 && (
            <span className="total-budget">/ {formatCurrency(totalBudget)} budget</span>
          )}
        </div>
      </div>
      
      {/* Category bars */}
      <div className="cost-bars">
        {visibleCategories.map((cat, i) => (
          <CostBar key={cat.id} category={cat} maxSpend={maxSpend} delay={i * 100} />
        ))}
      </div>
      
      {/* Resources grid */}
      {visibleResources.length > 0 && (
        <div className="resources-grid">
          <h3>Top Resources</h3>
          <div className="resources-list">
            {visibleResources.map((res, i) => (
              <ResourceCard 
                key={res.id} 
                resource={res} 
                isHighlighted={currentStep?.highlightResources?.includes(res.id)}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Info panel */}
      {currentStep && (
        <motion.div 
          className="cost-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentStepIndex}
        >
          <h3>{currentStep.title}</h3>
          <p>{currentStep.description}</p>
        </motion.div>
      )}
      
      {/* Navigation */}
      <div className="cost-nav">
        <button 
          onClick={() => onStepChange?.(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
        >
          ← Previous
        </button>
        <span>{currentStepIndex + 1} / {story.steps.length}</span>
        <button 
          onClick={() => onStepChange?.(Math.min(story.steps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex >= story.steps.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default CloudCostCanvas;
