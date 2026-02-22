# Animated GIF Recording (Real Playback Capture)

## Problem

Current GIF export captures **1 static PNG per step** — a slideshow. All animations (node entries, edge draws, camera pans, pulse effects) are invisible. A 5-step story produces a 5-frame GIF.

## Solution

Record the actual DOM rendering during real-time playback at ~10fps using `toCanvas()` (html-to-image) in a `requestAnimationFrame` loop, feeding canvas frames directly to `gif.js`.

## Architecture

```
User clicks "Record GIF"
  → reset to step 0, wait for settle
  → start auto-play (existing StoryContext.play())
  → start rAF capture loop:
      each frame: toCanvas(element) → gif.addFrame(canvas)
  → when playback ends (isPlaying → false):
      stop capture loop
      gif.render() → blob → download
```

Key insight: we piggyback on the **existing auto-advance system** in StoryContext. The play() function already advances steps using each step's `duration` field (default 2000ms). We just record what's on screen while it plays.

## Files to Change

### 1. `src/utils/export.ts` — Add `recordAnimatedGif()`

New function alongside the existing `exportToGif()` (which stays for backwards compat):

```typescript
export interface RecordOptions {
  filename?: string;
  /** Viewport scale (1 = native, 0.5 = half size). Lower = faster capture = more fps */
  scale?: number;
  /** Target fps cap (actual fps depends on toCanvas speed). Default: 12 */
  targetFps?: number;
  /** Background color */
  backgroundColor?: string;
  /** GIF quality (1-20, lower = better). Default: 10 */
  gifQuality?: number;
  /** Progress callback: phase + percentage */
  onProgress?: (phase: 'recording' | 'encoding', pct: number) => void;
  /** Called when recording starts (after settle) */
  onRecordingStart?: () => void;
}
```

Implementation:
- Create a `GIF` instance sized to `element.getBoundingClientRect() * scale`
- Start a capture loop using `requestAnimationFrame`:
  - Throttle to `targetFps` using timestamp delta
  - Call `toCanvas(element, { pixelRatio: scale, filter: exportFilter })`
  - `gif.addFrame(canvas, { delay: frameDelta, copy: true })`
  - Track frame count for progress reporting
- Return a `RecordingSession` object with `.stop()` method that:
  - Stops the rAF loop
  - Calls `gif.render()`
  - Returns a `Promise<Blob>` that resolves on `gif.on('finished')`

The caller (ExportButton) is responsible for starting/stopping playback — the recorder just captures whatever is on screen.

### 2. `src/components/ExportButton.tsx` — Add "Record GIF" option

Add a new menu item in the Animation section: **"Record GIF"** (distinct from old "Animated GIF").

New flow for "Record GIF":
1. `reset()` → wait 500ms for full settle (camera + nodes)
2. Call `recordAnimatedGif(element, options)` → get `RecordingSession`
3. Call `play()` to start auto-advance
4. Listen for playback end: when `isPlaying` transitions from `true` → `false`, call `session.stop()`
5. Wait for encoding, download blob
6. Show progress: "Recording step 2/5..." during playback, "Encoding GIF..." during render

State additions:
- `isRecording: boolean` — show red recording indicator
- `recordingSession: RecordingSession | null` — ref to stop on completion

The old "Animated GIF" (slideshow) option will be replaced. The `handleExport('gif')` path in ExportButton will use the new recording approach. The old `exportToGif()` function stays in `export.ts` for programmatic use but is no longer reachable from the UI.

### 3. `src/components/ExportButton.css` — Recording indicator styles

- Red pulsing dot next to "Recording..." text
- Recording progress bar

### 4. `src/utils/export.ts` — Keep old `exportToGif` unchanged

No breaking changes. The new function is additive.

## Key Design Decisions

**Why `toCanvas()` instead of `toPng()`?**
`toCanvas()` returns an `HTMLCanvasElement` directly — gif.js accepts canvas natively via `addFrame()`. This skips the PNG encode → data URL → Image decode round-trip that `toPng()` requires, saving ~30-50ms per frame.

**Why rAF loop instead of setInterval?**
`requestAnimationFrame` syncs with the browser's paint cycle, ensuring we capture frames that are actually rendered. setInterval could fire between paints, wasting capture calls on stale frames.

**Why throttle to ~12fps?**
`toCanvas()` takes ~100-200ms per call on a typical FlowStory canvas. Targeting 12fps gives ~83ms budget per frame — achievable on simpler canvases, and on complex ones we'll naturally drop to whatever rate `toCanvas()` can sustain. 12fps is enough to clearly show node fades (250-400ms), edge draws (400ms), and camera pans (500ms).

**Why scale=1 by default (not 2)?**
The current static export uses 2x for high-DPI PNGs. But for GIF recording, 2x means 4x the pixels to rasterize per frame, halving the achievable fps. 1x produces a reasonably sized GIF (~800-1200px wide) with better animation fluidity.

**Why piggyback on `play()` instead of manual step advancement?**
The auto-advance system already respects per-step `duration` fields, handles end-of-story detection, and triggers all the real React re-renders + animations. Recording what the user would see during normal playback is exactly the right thing to capture.

## Timing Math

For a typical 5-step story with 2000ms default step duration:
- Total playback: ~10s (5 × 2000ms)
- At 10fps capture rate: ~100 frames
- Settle time per step: ~1600ms (ANIMATION_TIMING.totalStepTransition)
- The step duration (2000ms) > settle time (1600ms), so animations complete before next step
- GIF encoding: ~2-5s for 100 frames (gif.js with 2 workers)
- Total user wait: ~15s

## Verification

1. `npx tsc --noEmit` — zero type errors
2. `npm run dev` — app loads, new "Record GIF" button visible in export dropdown
3. Record a story-flow story → GIF shows node entry animations, edge draws, camera pans
4. Record a service-flow story → GIF shows call activation, service highlighting
5. Old "Animated GIF" still works (or is removed, depending on decision)
6. Recording can be cancelled mid-capture
7. Progress UI shows recording vs encoding phases
