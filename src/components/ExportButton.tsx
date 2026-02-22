import { useState, useRef, useEffect, useCallback } from 'react';
import { exportAndDownload, getExportableElement, recordAnimatedGif, downloadBlob, type ExportFormat, type ExportOptions, type RecordingSession } from '../utils/export';
import { useStory, usePlayback } from '../context';
import { useTheme } from '../themes';
import './ExportButton.css';

/** Props for ExportButton */
export interface ExportButtonProps {
  /** Optional custom class name */
  className?: string;
  /** Export options */
  options?: ExportOptions;
  /** Show format labels */
  showLabels?: boolean;
  /** Callback when export starts */
  onExportStart?: () => void;
  /** Callback when export completes */
  onExportComplete?: (format: ExportFormat) => void;
  /** Callback when export fails */
  onExportError?: (error: Error) => void;
}

/**
 * Export button component with format dropdown
 */
export function ExportButton({
  className = '',
  options = {},
  showLabels = true,
  onExportStart,
  onExportComplete,
  onExportError,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPhase, setRecordingPhase] = useState<'recording' | 'encoding' | null>(null);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const recordingSessionRef = useRef<RecordingSession | null>(null);
  const { story, currentStepIndex } = useStory();
  const { isPlaying, totalSteps, goToStep, play, reset } = usePlayback();
  const { theme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Generate filename based on story and step
  const getFilename = useCallback((format: ExportFormat) => {
    const storyId = story?.id || 'story';
    if (format === 'gif') {
      return `${storyId}-animated`;
    }
    const stepNum = currentStepIndex + 1;
    return `${storyId}-step-${stepNum}`;
  }, [story, currentStepIndex]);

  // When playback ends during recording, finalize the GIF
  useEffect(() => {
    if (isRecording && !isPlaying && recordingSessionRef.current) {
      const session = recordingSessionRef.current;
      recordingSessionRef.current = null;
      setRecordingPhase('encoding');

      const storyId = story?.id || 'story';
      session.stop()
        .then((blob) => {
          downloadBlob(blob, `${storyId}-animated.gif`);
          onExportComplete?.('gif');
        })
        .catch((error) => {
          const err = error instanceof Error ? error : new Error('GIF encoding failed');
          setExportError(err.message);
          onExportError?.(err);
        })
        .finally(() => {
          setIsExporting(false);
          setIsRecording(false);
          setRecordingPhase(null);
        });
    }
  }, [isPlaying, isRecording, story, onExportComplete, onExportError]);

  // Handle GIF recording
  const handleRecordGif = useCallback(async () => {
    setIsExporting(true);
    setIsRecording(true);
    setRecordingPhase('recording');
    setExportError(null);
    setIsOpen(false);
    onExportStart?.();

    try {
      const element = getExportableElement();
      if (!element) throw new Error('Could not find exportable element');

      const backgroundColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';

      // Reset to step 0 and wait for full settle
      reset();
      await new Promise(r => setTimeout(r, 500));

      // Start recording
      const session = recordAnimatedGif(element, {
        scale: 1,
        targetFps: 12,
        backgroundColor,
        gifQuality: 10,
        onProgress: (phase, pct) => {
          setRecordingPhase(phase);
          if (phase === 'encoding') {
            setExportProgress({ current: Math.round(pct * 100), total: 100 });
          }
        },
      });

      recordingSessionRef.current = session;

      // Start playback — the useEffect above handles the rest
      play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Recording failed');
      setExportError(err.message);
      onExportError?.(err);
      setIsExporting(false);
      setIsRecording(false);
      setRecordingPhase(null);
    }
  }, [theme, reset, play, onExportStart, onExportError]);

  // Handle static export (PNG, SVG, PDF)
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (format === 'gif') {
      handleRecordGif();
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportProgress(null);
    setIsOpen(false);
    onExportStart?.();

    try {
      const element = getExportableElement();
      if (!element) throw new Error('Could not find exportable element');

      const backgroundColor = theme === 'dark' ? '#1e1e1e' : '#ffffff';

      await exportAndDownload(element, format, {
        ...options,
        filename: options.filename || getFilename(format),
        backgroundColor,
      });

      onExportComplete?.(format);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Export failed');
      setExportError(err.message);
      onExportError?.(err);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [theme, options, getFilename, handleRecordGif, onExportStart, onExportComplete, onExportError]);

  // Cancel recording
  const handleCancelRecording = useCallback(() => {
    if (recordingSessionRef.current) {
      recordingSessionRef.current = null;
    }
    setIsExporting(false);
    setIsRecording(false);
    setRecordingPhase(null);
    setExportProgress(null);
  }, []);

  const progressText = isRecording
    ? recordingPhase === 'encoding'
      ? `Encoding GIF${exportProgress ? ` ${exportProgress.current}%` : '...'}`
      : 'Recording...'
    : exportProgress
      ? `Capturing ${exportProgress.current}/${exportProgress.total}...`
      : 'Exporting...';

  return (
    <div 
      className={`export-button-container ${className}`} 
      ref={dropdownRef}
      data-testid="export-container"
    >
      <button
        className={`export-button ${isOpen ? 'export-button-active' : ''} ${isRecording ? 'export-button-recording' : ''}`}
        onClick={isRecording ? handleCancelRecording : () => setIsOpen(!isOpen)}
        disabled={isExporting && !isRecording || !story}
        data-testid="export-button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isRecording ? 'Cancel recording' : 'Export'}
      >
        {isRecording ? (
          <>
            <span className="export-recording-dot" />
            {showLabels && <span className="export-label">{progressText}</span>}
            <span className="export-cancel-hint">Cancel</span>
          </>
        ) : isExporting ? (
          <>
            <span className="export-icon export-icon-loading">⏳</span>
            {showLabels && <span className="export-label">{progressText}</span>}
          </>
        ) : (
          <>
            <span className="export-icon">📤</span>
            {showLabels && <span className="export-label">Export</span>}
            <span className="export-chevron">▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="export-dropdown" role="menu" data-testid="export-dropdown">
          <div className="export-section">
            <div className="export-section-title">Static Image</div>
            <button
              className="export-option"
              onClick={() => handleExport('png')}
              role="menuitem"
              data-testid="export-png"
            >
              <span className="export-option-icon">🖼️</span>
              <span className="export-option-text">
                <span className="export-option-label">PNG Image</span>
                <span className="export-option-desc">High quality raster image</span>
              </span>
            </button>
            <button
              className="export-option"
              onClick={() => handleExport('svg')}
              role="menuitem"
              data-testid="export-svg"
            >
              <span className="export-option-icon">📐</span>
              <span className="export-option-text">
                <span className="export-option-label">SVG Vector</span>
                <span className="export-option-desc">Scalable vector graphics</span>
              </span>
            </button>
            <button
              className="export-option"
              onClick={() => handleExport('pdf')}
              role="menuitem"
              data-testid="export-pdf"
            >
              <span className="export-option-icon">📄</span>
              <span className="export-option-text">
                <span className="export-option-label">PDF Document</span>
                <span className="export-option-desc">Printable document format</span>
              </span>
            </button>
          </div>
          
          <div className="export-section">
            <div className="export-section-title">Animation</div>
            <button
              className="export-option"
              onClick={() => handleExport('gif')}
              role="menuitem"
              data-testid="export-gif"
              disabled={totalSteps < 2}
              title={totalSteps < 2 ? 'Need at least 2 steps for animation' : undefined}
            >
              <span className="export-option-icon">🎬</span>
              <span className="export-option-text">
                <span className="export-option-label">Record GIF</span>
                <span className="export-option-desc">
                  {totalSteps < 2
                    ? 'Need multiple steps'
                    : `Records animated playback of all ${totalSteps} steps`}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {exportError && (
        <div className="export-error" role="alert" data-testid="export-error">
          {exportError}
        </div>
      )}
    </div>
  );
}

export default ExportButton;
