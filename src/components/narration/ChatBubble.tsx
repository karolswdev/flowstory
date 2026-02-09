import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './chat-bubble.css';

interface ChatBubbleProps {
  /** Speaker info */
  speaker: {
    name: string;
    avatar: string;
    isNarrator?: boolean;
  };
  /** Message text */
  text: string;
  /** Position relative to viewport */
  position?: 'left' | 'right' | 'center';
  /** Tail pointing direction */
  tailDirection?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  /** Show typing animation before revealing text */
  showTyping?: boolean;
  /** Typing animation duration in ms */
  typingDuration?: number;
  /** Whether bubble is visible */
  visible?: boolean;
  /** Called when typing animation completes */
  onTypingComplete?: () => void;
  /** Called when bubble is clicked */
  onClick?: () => void;
}

/**
 * ChatBubble - Narrative chat bubble with speaker avatar
 * 
 * Features:
 * - Speaker avatar and name
 * - Optional typing animation
 * - Tail pointing to focal element
 * - Smooth entrance/exit animations
 */
export const ChatBubble = memo(function ChatBubble({
  speaker,
  text,
  position = 'right',
  tailDirection = 'none',
  showTyping = false,
  typingDuration = 1000,
  visible = true,
  onTypingComplete,
  onClick,
}: ChatBubbleProps) {
  const [isTyping, setIsTyping] = useState(showTyping);
  const [displayedText, setDisplayedText] = useState(showTyping ? '' : text);

  // Handle typing animation
  useEffect(() => {
    if (!showTyping || !visible) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText('');

    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      
      // Reveal text character by character
      let charIndex = 0;
      const charTimer = setInterval(() => {
        charIndex++;
        setDisplayedText(text.slice(0, charIndex));
        
        if (charIndex >= text.length) {
          clearInterval(charTimer);
          onTypingComplete?.();
        }
      }, 20); // ~50 chars per second

      return () => clearInterval(charTimer);
    }, typingDuration);

    return () => clearTimeout(typingTimer);
  }, [text, showTyping, typingDuration, visible, onTypingComplete]);

  // Reset when text changes
  useEffect(() => {
    if (!showTyping) {
      setDisplayedText(text);
    }
  }, [text, showTyping]);

  if (!visible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`chat-bubble chat-bubble--${position} chat-bubble--tail-${tailDirection}`}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 30 
        }}
        onClick={onClick}
        role="dialog"
        aria-label={`${speaker.name} says`}
        data-testid="chat-bubble"
      >
        {/* Tail */}
        {tailDirection !== 'none' && (
          <div className={`chat-bubble-tail chat-bubble-tail--${tailDirection}`} />
        )}

        {/* Header with avatar */}
        <div className="chat-bubble-header">
          <motion.span 
            className="chat-bubble-avatar"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          >
            {speaker.avatar}
          </motion.span>
          <span className="chat-bubble-name">
            {speaker.name}
            {speaker.isNarrator && (
              <span className="chat-bubble-narrator-badge">Narrator</span>
            )}
          </span>
        </div>

        {/* Message content */}
        <div className="chat-bubble-content">
          {isTyping ? (
            <div className="chat-bubble-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <p className="chat-bubble-text" aria-live="polite">
              {displayedText}
              {showTyping && displayedText.length < text.length && (
                <span className="typing-cursor">|</span>
              )}
            </p>
          )}
        </div>

        {/* Click hint */}
        <div className="chat-bubble-hint">
          Click or press <kbd>Space</kbd> to continue
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default ChatBubble;
