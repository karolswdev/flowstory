import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { UserStory, StoryStep } from '../types/story';

/** State for story playback */
export interface StoryState {
  /** The loaded story */
  story: UserStory | null;
  /** Current step index (0-based) */
  currentStepIndex: number;
  /** Current step object */
  currentStep: StoryStep | null;
  /** Total number of steps */
  totalSteps: number;
  /** Node IDs active in current step */
  activeNodeIds: Set<string>;
  /** Edge IDs active in current step */
  activeEdgeIds: Set<string>;
  /** Node IDs completed (shown in previous steps) */
  completedNodeIds: Set<string>;
  /** Edge IDs completed */
  completedEdgeIds: Set<string>;
  /** Whether story is loaded */
  isLoaded: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether playback is active */
  isPlaying: boolean;
}

/** Actions for story playback */
export interface StoryActions {
  /** Load a story */
  loadStory: (story: UserStory) => void;
  /** Go to a specific step (0-based index) */
  goToStep: (index: number) => void;
  /** Go to next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Reset to first step */
  reset: () => void;
  /** Clear the story */
  clear: () => void;
  /** Start auto-play */
  play: () => void;
  /** Pause auto-play */
  pause: () => void;
  /** Toggle play/pause */
  togglePlay: () => void;
}

export type StoryContextValue = StoryState & StoryActions;

export const StoryContext = createContext<StoryContextValue | null>(null);

/** Default step duration in ms */
const DEFAULT_STEP_DURATION = 2000;

/** Calculate which nodes/edges are active and completed for a given step */
function calculateStepState(story: UserStory, stepIndex: number) {
  const steps = story.steps.sort((a, b) => a.order - b.order);
  const currentStep = steps[stepIndex] || null;
  
  const activeNodeIds = new Set<string>(currentStep?.nodeIds || []);
  const activeEdgeIds = new Set<string>(currentStep?.edgeIds || []);
  
  // Completed = shown in any previous step but not in current
  const completedNodeIds = new Set<string>();
  const completedEdgeIds = new Set<string>();
  
  for (let i = 0; i < stepIndex; i++) {
    const prevStep = steps[i];
    prevStep.nodeIds.forEach(id => {
      if (!activeNodeIds.has(id)) {
        completedNodeIds.add(id);
      }
    });
    prevStep.edgeIds.forEach(id => {
      if (!activeEdgeIds.has(id)) {
        completedEdgeIds.add(id);
      }
    });
  }
  
  return { activeNodeIds, activeEdgeIds, completedNodeIds, completedEdgeIds, currentStep };
}

export interface StoryProviderProps {
  children: ReactNode;
  /** Optional initial story */
  initialStory?: UserStory;
}

export function StoryProvider({ children, initialStory }: StoryProviderProps) {
  const [story, setStory] = useState<UserStory | null>(initialStory || null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  const totalSteps = story?.steps.length || 0;

  const { activeNodeIds, activeEdgeIds, completedNodeIds, completedEdgeIds, currentStep } = useMemo(() => {
    if (!story) {
      return {
        activeNodeIds: new Set<string>(),
        activeEdgeIds: new Set<string>(),
        completedNodeIds: new Set<string>(),
        completedEdgeIds: new Set<string>(),
        currentStep: null,
      };
    }
    return calculateStepState(story, currentStepIndex);
  }, [story, currentStepIndex]);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || !story) return;

    const duration = currentStep?.duration || DEFAULT_STEP_DURATION;
    
    timerRef.current = window.setTimeout(() => {
      if (currentStepIndex < totalSteps - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Reached end, stop playing
        setIsPlaying(false);
      }
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, currentStep, story, totalSteps]);

  const loadStory = useCallback((newStory: UserStory) => {
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    try {
      setStory(newStory);
      setCurrentStepIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load story');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToStep = useCallback((index: number) => {
    if (!story) return;
    const clampedIndex = Math.max(0, Math.min(index, story.steps.length - 1));
    setCurrentStepIndex(clampedIndex);
  }, [story]);

  const nextStep = useCallback(() => {
    if (!story) return;
    setCurrentStepIndex(prev => Math.min(prev + 1, story.steps.length - 1));
  }, [story]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  const clear = useCallback(() => {
    setStory(null);
    setCurrentStepIndex(0);
    setError(null);
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    if (!story) return;
    // If at end, restart from beginning
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [story, currentStepIndex, totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const value: StoryContextValue = {
    story,
    currentStepIndex,
    currentStep,
    totalSteps,
    activeNodeIds,
    activeEdgeIds,
    completedNodeIds,
    completedEdgeIds,
    isLoaded: story !== null,
    isLoading,
    error,
    isPlaying,
    loadStory,
    goToStep,
    nextStep,
    prevStep,
    reset,
    clear,
    play,
    pause,
    togglePlay,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

/** Hook to access story context */
export function useStory(): StoryContextValue {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
}

/** Hook for just the current step (for narrative panel) */
export function useCurrentStep() {
  const { currentStep, currentStepIndex, totalSteps } = useStory();
  return { currentStep, currentStepIndex, totalSteps };
}

/** Hook for navigation controls */
export function useStoryNavigation() {
  const { currentStepIndex, totalSteps, nextStep, prevStep, goToStep, reset } = useStory();
  const canGoNext = currentStepIndex < totalSteps - 1;
  const canGoPrev = currentStepIndex > 0;
  return { currentStepIndex, totalSteps, nextStep, prevStep, goToStep, reset, canGoNext, canGoPrev };
}

/** Hook for playback controls */
export function usePlayback() {
  const { isPlaying, currentStepIndex, totalSteps, play, pause, togglePlay, goToStep, reset } = useStory();
  const canPlay = totalSteps > 0;
  const progress = totalSteps > 0 ? currentStepIndex / (totalSteps - 1) : 0;
  return { isPlaying, canPlay, progress, currentStepIndex, totalSteps, play, pause, togglePlay, goToStep, reset };
}
