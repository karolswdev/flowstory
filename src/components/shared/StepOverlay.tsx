import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './step-overlay.css';

/* ─── Micro inline-markup parser ─── */
// Supports: **bold**, *italic*, `code`, {color:name|text}, \n → <br>
// Color names map to Tailwind palette via CSS custom properties.

type Token =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'code'; value: string }
  | { type: 'color'; color: string; value: string }
  | { type: 'br' };

const TOKEN_RE =
  /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\{color:([a-zA-Z0-9#]+)\|(.+?)\}|(\n)/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const m of input.matchAll(TOKEN_RE)) {
    const idx = m.index!;
    if (idx > lastIndex) tokens.push({ type: 'text', value: input.slice(lastIndex, idx) });

    if (m[1] != null) tokens.push({ type: 'bold', value: m[1] });
    else if (m[2] != null) tokens.push({ type: 'italic', value: m[2] });
    else if (m[3] != null) tokens.push({ type: 'code', value: m[3] });
    else if (m[4] != null && m[5] != null) tokens.push({ type: 'color', color: m[4], value: m[5] });
    else if (m[6] != null) tokens.push({ type: 'br' });

    lastIndex = idx + m[0].length;
  }

  if (lastIndex < input.length) tokens.push({ type: 'text', value: input.slice(lastIndex) });
  return tokens;
}

const COLOR_MAP: Record<string, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
  orange: '#F97316',
  amber: '#F59E0B',
  purple: '#A855F7',
  pink: '#EC4899',
  cyan: '#06B6D4',
  teal: '#14B8A6',
  yellow: '#EAB308',
  gray: '#6B7280',
};

function resolveColor(name: string): string {
  return COLOR_MAP[name.toLowerCase()] ?? name; // pass-through hex like #3B82F6
}

function renderTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'text':   return <span key={i}>{t.value}</span>;
      case 'bold':   return <strong key={i} className="so-bold">{t.value}</strong>;
      case 'italic': return <em key={i} className="so-italic">{t.value}</em>;
      case 'code':   return <code key={i} className="so-code">{t.value}</code>;
      case 'color':  return <span key={i} className="so-color" style={{ color: resolveColor(t.color) }}>{t.value}</span>;
      case 'br':     return <br key={i} />;
    }
  });
}

function RichText({ text }: { text: string }) {
  const nodes = useMemo(() => renderTokens(tokenize(text)), [text]);
  return <>{nodes}</>;
}

export interface StepOverlayProps {
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step title */
  title?: string;
  /** Simple narrative text */
  narrative?: string;
  /** Structured narration (speaker + message) */
  narration?: {
    speaker?: string;
    message: string;
  };
  /** Step description (alternative to narrative) */
  description?: string;
  /** Optional accent color for dots */
  accentColor?: string;
  /** Callback when a step dot is clicked */
  onStepChange?: (index: number) => void;
  /** Show step progress dots */
  showDots?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const StepOverlay = memo(function StepOverlay({
  stepIndex,
  totalSteps,
  title,
  narrative,
  narration,
  description,
  accentColor,
  onStepChange,
  showDots = false,
  className,
}: StepOverlayProps) {
  const text = narrative || description;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        className={`step-overlay ${className || ''}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={accentColor ? { '--step-accent': accentColor } as React.CSSProperties : undefined}
      >
        <div className="step-overlay__badge">
          Step {stepIndex + 1} / {totalSteps}
        </div>

        {title && <h3 className="step-overlay__title">{title}</h3>}

        {text && <p className="step-overlay__text"><RichText text={text} /></p>}

        {narration && (
          <div className="step-overlay__narration">
            {narration.speaker && (
              <span className="step-overlay__speaker">{narration.speaker}:</span>
            )}
            <span className="step-overlay__message"><RichText text={narration.message} /></span>
          </div>
        )}

        {showDots && totalSteps > 1 && (
          <div className="step-overlay__dots">
            {Array.from({ length: totalSteps }, (_, i) => (
              onStepChange ? (
                <button
                  key={i}
                  className={`step-overlay__dot ${i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}`}
                  onClick={() => onStepChange(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ) : (
                <div
                  key={i}
                  className={`step-overlay__dot ${i === stepIndex ? 'active' : i < stepIndex ? 'complete' : ''}`}
                />
              )
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
