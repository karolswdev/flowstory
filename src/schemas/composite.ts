import { z } from 'zod';
import { RENDERER_MAP, type SpecializedStoryType } from '../renderers/specialized';

// ============================================================================
// Virtual Step — flattened from all sections
// ============================================================================

export interface CompositeVirtualStep {
  id: string;
  title?: string;
  narrative?: string;
  narration?: { speaker?: string; message: string };
  description?: string;
  sectionIndex: number;
  localStepIndex: number;
  sectionTitle: string;
  sectionRenderer: SpecializedStoryType;
  accentColor?: string;
}

// ============================================================================
// Section Schema — passthrough lets renderer-specific keys flow through
// ============================================================================

const CompositeSectionSchema = z.object({
  renderer: z.string(),
  title: z.string(),
  accentColor: z.string().optional(),
}).passthrough();

// ============================================================================
// Raw (pre-transform) story schema
// ============================================================================

const CompositeStoryRawSchema = z.object({
  id: z.string(),
  title: z.string(),
  renderer: z.literal('composite'),
  schemaVersion: z.string().optional(),
  version: z.number().optional(),
  description: z.string().optional(),
  sections: z.array(CompositeSectionSchema).min(1),
});

// ============================================================================
// Main schema with validation + transform
// ============================================================================

export const CompositeStorySchema = CompositeStoryRawSchema
  .superRefine((data, ctx) => {
    data.sections.forEach((section, sectionIdx) => {
      const rendererType = section.renderer as SpecializedStoryType;
      const config = RENDERER_MAP[rendererType];

      if (!config) {
        ctx.addIssue({
          code: 'custom',
          message: `Unknown renderer "${section.renderer}" in section ${sectionIdx} ("${section.title}")`,
          path: ['sections', sectionIdx, 'renderer'],
        });
        return;
      }

      // Build a mini-story object that the inner schema expects
      const { renderer: _r, title: _t, accentColor: _a, ...rest } = section;
      const miniStory = {
        ...rest,
        id: `${data.id}-section-${sectionIdx}`,
        renderer: rendererType,
        type: rendererType,
        schemaVersion: data.schemaVersion || '2.0',
        version: data.version || 2,
        title: section.title,
      };

      const result = config.schema.safeParse(miniStory);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: 'custom',
            message: `Section ${sectionIdx} ("${section.title}"): ${issue.message}`,
            path: ['sections', sectionIdx, ...(issue.path || [])],
          });
        }
        return;
      }

      // Check that section has at least 1 step
      const steps = (section as any).steps;
      if (!Array.isArray(steps) || steps.length === 0) {
        ctx.addIssue({
          code: 'custom',
          message: `Section ${sectionIdx} ("${section.title}") must have at least 1 step`,
          path: ['sections', sectionIdx, 'steps'],
        });
      }
    });
  })
  .transform((data) => {
    // Flatten all sections' steps into one virtual array
    const virtualSteps: CompositeVirtualStep[] = [];

    // Also store validated section stories for the canvas to use
    const validatedSections: any[] = [];

    data.sections.forEach((section, sectionIdx) => {
      const rendererType = section.renderer as SpecializedStoryType;
      const config = RENDERER_MAP[rendererType];

      // Build mini-story for canvas consumption
      const { renderer: _r, title: _t, accentColor: _a, ...rest } = section;
      const miniStory = {
        ...rest,
        id: `${data.id}-section-${sectionIdx}`,
        renderer: rendererType,
        type: rendererType,
        schemaVersion: data.schemaVersion || '2.0',
        version: data.version || 2,
        title: section.title,
      };

      const validated = config.schema.parse(miniStory);
      validatedSections.push({
        ...validated,
        _renderer: rendererType,
        _title: section.title,
        _accentColor: section.accentColor,
      });

      const steps = validated.steps as any[];
      steps.forEach((step: any, localIdx: number) => {
        virtualSteps.push({
          id: `${data.id}-s${sectionIdx}-step${localIdx}`,
          title: step.title,
          narrative: step.narrative,
          narration: step.narration,
          description: step.description,
          sectionIndex: sectionIdx,
          localStepIndex: localIdx,
          sectionTitle: section.title,
          sectionRenderer: rendererType,
          accentColor: section.accentColor,
        });
      });
    });

    return {
      id: data.id,
      title: data.title,
      renderer: 'composite' as const,
      schemaVersion: data.schemaVersion,
      description: data.description,
      sections: validatedSections,
      steps: virtualSteps,
    };
  });

// ============================================================================
// Exported types
// ============================================================================

export type CompositeStory = z.infer<typeof CompositeStorySchema>;
