declare module 'gif.js' {
  interface GIFOptions {
    /** Number of web workers to spawn */
    workers?: number;
    /** Pixel sample interval (lower = better quality, slower) */
    quality?: number;
    /** Width of the GIF */
    width?: number;
    /** Height of the GIF */
    height?: number;
    /** URL of the worker script */
    workerScript?: string;
    /** Repeat count (-1 = no repeat, 0 = forever) */
    repeat?: number;
    /** Background color */
    background?: string;
    /** Transparent color */
    transparent?: string | null;
    /** Enable dithering */
    dither?: boolean;
    /** Debug mode */
    debug?: boolean;
  }

  interface FrameOptions {
    /** Frame delay in ms */
    delay?: number;
    /** Copy pixels from previous frame */
    copy?: boolean;
    /** Frame disposal mode */
    dispose?: number;
    /** Transparent color for this frame */
    transparent?: string | null;
  }

  class GIF {
    constructor(options?: GIFOptions);
    
    /** Add a frame to the GIF */
    addFrame(
      image: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions
    ): void;
    
    /** Render the GIF */
    render(): void;
    
    /** Abort rendering */
    abort(): void;
    
    /** Add event listener */
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: 'abort', callback: () => void): void;
    on(event: 'start', callback: () => void): void;
    
    /** Running state */
    readonly running: boolean;
  }

  export = GIF;
}
