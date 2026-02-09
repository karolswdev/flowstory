import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {
  JOB_STATUSES,
  GATE_STATUSES,
  TRIGGER_TYPES,
  ARTIFACT_TYPES,
  JOB_STATUS_COLORS,
  JOB_STATUS_ICONS,
  GATE_STATUS_COLORS,
  TRIGGER_TYPE_ICONS,
  ARTIFACT_TYPE_ICONS,
} from '../src/schemas/pipeline';

test.describe('Pipeline Renderer', () => {
  test.describe('Schema Validation', () => {
    test('ci-cd-deploy story validates against schema', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.renderer).toBe('pipeline');
      expect(data.schemaVersion).toBe('2.0');
      expect(data.stages.length).toBeGreaterThan(0);
      expect(data.jobs.length).toBeGreaterThan(0);
      expect(data.steps.length).toBeGreaterThan(0);
    });

    test('stages have required fields', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      for (const stage of data.stages) {
        expect(stage.id).toBeDefined();
        expect(stage.name).toBeDefined();
      }
    });

    test('jobs have valid statuses', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      for (const job of data.jobs) {
        expect(job.id).toBeDefined();
        expect(job.stage).toBeDefined();
        expect(job.name).toBeDefined();
        expect(JOB_STATUSES).toContain(job.status);
      }
    });

    test('pipeline trigger is valid', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.pipeline.trigger).toBeDefined();
      expect(TRIGGER_TYPES).toContain(data.pipeline.trigger.type);
    });

    test('gate has valid status', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      const stageWithGate = data.stages.find((s: any) => s.gate);
      expect(stageWithGate).toBeDefined();
      expect(GATE_STATUSES).toContain(stageWithGate.gate.status);
    });

    test('steps reference valid stages/jobs', () => {
      const content = fs.readFileSync('stories/pipeline/ci-cd-deploy.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      const stageIds = new Set(data.stages.map((s: any) => s.id));
      const jobIds = new Set(data.jobs.map((j: any) => j.id));

      for (const step of data.steps) {
        if (step.activeStages) {
          for (const stageId of step.activeStages) {
            expect(stageIds.has(stageId)).toBe(true);
          }
        }
        if (step.activeJobs) {
          for (const jobId of step.activeJobs) {
            expect(jobIds.has(jobId)).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Job Status Colors', () => {
    test('success is green', () => {
      expect(JOB_STATUS_COLORS.success).toBe('#4CAF50');
    });

    test('failed is red', () => {
      expect(JOB_STATUS_COLORS.failed).toBe('#F44336');
    });

    test('running is orange', () => {
      expect(JOB_STATUS_COLORS.running).toBe('#FF9800');
    });

    test('pending is gray', () => {
      expect(JOB_STATUS_COLORS.pending).toBe('#9E9E9E');
    });
  });

  test.describe('Job Status Icons', () => {
    test('success has checkmark', () => {
      expect(JOB_STATUS_ICONS.success).toBe('✅');
    });

    test('failed has X', () => {
      expect(JOB_STATUS_ICONS.failed).toBe('❌');
    });

    test('running has refresh', () => {
      expect(JOB_STATUS_ICONS.running).toBe('🔄');
    });

    test('pending has hourglass', () => {
      expect(JOB_STATUS_ICONS.pending).toBe('⏳');
    });
  });

  test.describe('Gate Status Colors', () => {
    test('pending is orange', () => {
      expect(GATE_STATUS_COLORS.pending).toBe('#FF9800');
    });

    test('approved is green', () => {
      expect(GATE_STATUS_COLORS.approved).toBe('#4CAF50');
    });

    test('rejected is red', () => {
      expect(GATE_STATUS_COLORS.rejected).toBe('#F44336');
    });
  });

  test.describe('Trigger Type Icons', () => {
    test('push has upload icon', () => {
      expect(TRIGGER_TYPE_ICONS.push).toBe('📤');
    });

    test('pull_request has merge icon', () => {
      expect(TRIGGER_TYPE_ICONS.pull_request).toBe('🔀');
    });

    test('schedule has clock icon', () => {
      expect(TRIGGER_TYPE_ICONS.schedule).toBe('⏰');
    });

    test('manual has finger icon', () => {
      expect(TRIGGER_TYPE_ICONS.manual).toBe('👆');
    });
  });

  test.describe('Artifact Type Icons', () => {
    test('build has package icon', () => {
      expect(ARTIFACT_TYPE_ICONS.build).toBe('📦');
    });

    test('test-results has test tube', () => {
      expect(ARTIFACT_TYPE_ICONS['test-results']).toBe('🧪');
    });

    test('docker-image has whale', () => {
      expect(ARTIFACT_TYPE_ICONS['docker-image']).toBe('🐳');
    });
  });
});
