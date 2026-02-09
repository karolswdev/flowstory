import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import GIF from 'gif.js';

/** Export options */
export interface ExportOptions {
  /** File name (without extension) */
  filename?: string;
  /** Include background */
  includeBackground?: boolean;
  /** Scale factor for high-DPI export (default: 2) */
  scale?: number;
  /** Background color (for PNG/PDF) */
  backgroundColor?: string;
  /** Quality (0-1) for lossy formats */
  quality?: number;
  /** GIF frame delay in ms (default: 1000) */
  gifDelay?: number;
  /** Total steps for GIF export */
  totalSteps?: number;
  /** Callback to advance to next step (for GIF) */
  onAdvanceStep?: () => Promise<void>;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
}

/** Export format */
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'gif';

/** Default export options */
const DEFAULT_OPTIONS: Required<Omit<ExportOptions, 'onAdvanceStep' | 'onProgress' | 'totalSteps'>> = {
  filename: 'user-story',
  includeBackground: true,
  scale: 2,
  backgroundColor: '#ffffff',
  quality: 0.95,
  gifDelay: 1000,
};

/**
 * Filter function to exclude UI controls from export
 */
function exportFilter(node: Element): boolean {
  const className = node.className;
  if (typeof className === 'string') {
    // Exclude React Flow controls and minimap
    if (className.includes('react-flow__minimap')) return false;
    if (className.includes('react-flow__controls')) return false;
    if (className.includes('react-flow__panel')) return false;
    if (className.includes('playback-controls')) return false;
    if (className.includes('export-button')) return false;
  }
  return true;
}

/**
 * Export a DOM element to PNG format
 */
export async function exportToPng(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const { scale, backgroundColor, quality } = { ...DEFAULT_OPTIONS, ...options };
  
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor,
    quality,
    filter: exportFilter,
  });
  
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Export a DOM element to SVG format
 */
export async function exportToSvg(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const { backgroundColor } = { ...DEFAULT_OPTIONS, ...options };
  
  const dataUrl = await toSvg(element, {
    backgroundColor,
    filter: exportFilter,
  });
  
  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Export a DOM element to PDF format
 */
export async function exportToPdf(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const { scale, backgroundColor, quality } = { ...DEFAULT_OPTIONS, ...options };
  
  // First capture as PNG
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor,
    quality,
    filter: exportFilter,
  });
  
  // Get element dimensions
  const rect = element.getBoundingClientRect();
  const width = rect.width * scale;
  const height = rect.height * scale;
  
  // Create PDF with appropriate orientation
  const isLandscape = width > height;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
  });
  
  // Add image to PDF
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  
  // Return as Blob
  return pdf.output('blob');
}

/**
 * Export animated playback to GIF format
 */
export async function exportToGif(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<Blob> {
  const { 
    scale, 
    backgroundColor, 
    quality, 
    gifDelay,
    totalSteps = 1,
    onAdvanceStep,
    onProgress,
  } = { ...DEFAULT_OPTIONS, ...options };
  
  // Get element dimensions
  const rect = element.getBoundingClientRect();
  const width = Math.round(rect.width * scale);
  const height = Math.round(rect.height * scale);
  
  // Create GIF encoder
  const gif = new GIF({
    workers: 2,
    quality: Math.round((1 - (quality ?? 0.95)) * 20) + 1, // Convert to GIF quality (1-20, lower is better)
    width,
    height,
    workerScript: '/gif.worker.js', // Will need to copy this to public folder
  });
  
  return new Promise((resolve, reject) => {
    // Capture each frame
    const captureFrames = async () => {
      try {
        for (let i = 0; i < totalSteps; i++) {
          onProgress?.(i + 1, totalSteps);
          
          // Wait a bit for rendering to settle
          await new Promise(r => setTimeout(r, 100));
          
          // Capture current frame as image
          const dataUrl = await toPng(element, {
            pixelRatio: scale,
            backgroundColor,
            quality: 1, // Use max quality for individual frames
            filter: exportFilter,
          });
          
          // Convert to Image element
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolveImg, rejectImg) => {
            img.onload = () => resolveImg();
            img.onerror = rejectImg;
          });
          
          // Add frame to GIF
          gif.addFrame(img, { delay: gifDelay });
          
          // Advance to next step if not last
          if (i < totalSteps - 1 && onAdvanceStep) {
            await onAdvanceStep();
          }
        }
        
        // Render GIF
        gif.on('finished', (blob: Blob) => {
          resolve(blob);
        });
        
        gif.render();
      } catch (error) {
        reject(error);
      }
    };
    
    captureFrames();
  });
}

/**
 * Export element in the specified format
 */
export async function exportImage(
  element: HTMLElement,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<Blob> {
  switch (format) {
    case 'png':
      return exportToPng(element, options);
    case 'svg':
      return exportToSvg(element, options);
    case 'pdf':
      return exportToPdf(element, options);
    case 'gif':
      return exportToGif(element, options);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Trigger a file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get file extension for format
 */
function getExtension(format: ExportFormat): string {
  switch (format) {
    case 'png': return 'png';
    case 'svg': return 'svg';
    case 'pdf': return 'pdf';
    case 'gif': return 'gif';
    default: return 'png';
  }
}

/**
 * Export and download image
 */
export async function exportAndDownload(
  element: HTMLElement,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<void> {
  const { filename } = { ...DEFAULT_OPTIONS, ...options };
  const blob = await exportImage(element, format, options);
  const extension = getExtension(format);
  downloadBlob(blob, `${filename}.${extension}`);
}

/**
 * Get the React Flow viewport element for export
 */
export function getExportableElement(): HTMLElement | null {
  // Target the viewport pane which contains the actual graph
  return document.querySelector('.react-flow__viewport') as HTMLElement | null;
}

/**
 * Get dimensions of the exportable area
 */
export function getExportDimensions(element: HTMLElement): { width: number; height: number } {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}
