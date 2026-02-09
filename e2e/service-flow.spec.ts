import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import {
  SERVICE_TYPES,
  QUEUE_TYPES,
  CALL_TYPES,
  SERVICE_TYPE_ICONS,
  QUEUE_TYPE_ICONS,
  CALL_TYPE_COLORS,
  STATUS_COLORS,
} from '../src/schemas/service-flow';

test.describe('Service Flow Renderer', () => {
  test.describe('Schema Validation', () => {
    test('order-processing story validates against schema', () => {
      const content = fs.readFileSync('stories/service/order-processing.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.renderer).toBe('service-flow');
      expect(data.schemaVersion).toBe('2.0');
      expect(data.services.length).toBeGreaterThan(0);
      expect(data.calls.length).toBeGreaterThan(0);
      expect(data.steps.length).toBeGreaterThan(0);
    });

    test('services have required fields', () => {
      const content = fs.readFileSync('stories/service/order-processing.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.services.length).toBeGreaterThan(0);
      for (const service of data.services) {
        expect(service.id).toBeDefined();
        expect(service.name).toBeDefined();
        expect(SERVICE_TYPES).toContain(service.type);
      }
    });

    test('queues have required fields', () => {
      const content = fs.readFileSync('stories/service/order-processing.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.queues?.length).toBeGreaterThan(0);
      for (const queue of data.queues) {
        expect(queue.id).toBeDefined();
        expect(queue.name).toBeDefined();
        expect(QUEUE_TYPES).toContain(queue.type);
      }
    });

    test('calls have valid types', () => {
      const content = fs.readFileSync('stories/service/order-processing.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      expect(data.calls.length).toBeGreaterThan(0);
      for (const call of data.calls) {
        expect(CALL_TYPES).toContain(call.type);
        expect(call.from).toBeDefined();
        expect(call.to).toBeDefined();
      }
    });

    test('steps reference valid calls', () => {
      const content = fs.readFileSync('stories/service/order-processing.yaml', 'utf-8');
      const data = yaml.load(content) as any;

      const callIds = new Set(data.calls.map((c: any) => c.id));
      for (const step of data.steps) {
        for (const callId of step.activeCalls) {
          expect(callIds.has(callId)).toBe(true);
        }
      }
    });
  });

  test.describe('Service Type Icons', () => {
    test('api has gear icon', () => {
      expect(SERVICE_TYPE_ICONS.api).toBe('⚙️');
    });

    test('worker has worker icon', () => {
      expect(SERVICE_TYPE_ICONS.worker).toBe('👷');
    });

    test('gateway has door icon', () => {
      expect(SERVICE_TYPE_ICONS.gateway).toBe('🚪');
    });

    test('database has cabinet icon', () => {
      expect(SERVICE_TYPE_ICONS.database).toBe('🗄️');
    });
  });

  test.describe('Queue Type Icons', () => {
    test('queue has inbox icon', () => {
      expect(QUEUE_TYPE_ICONS.queue).toBe('📥');
    });

    test('topic has mailbox icon', () => {
      expect(QUEUE_TYPE_ICONS.topic).toBe('📬');
    });

    test('stream has scroll icon', () => {
      expect(QUEUE_TYPE_ICONS.stream).toBe('📜');
    });
  });

  test.describe('Call Type Colors', () => {
    test('sync is blue', () => {
      expect(CALL_TYPE_COLORS.sync).toBe('#2196F3');
    });

    test('async is purple', () => {
      expect(CALL_TYPE_COLORS.async).toBe('#9C27B0');
    });

    test('publish is orange', () => {
      expect(CALL_TYPE_COLORS.publish).toBe('#FF9800');
    });

    test('subscribe is teal', () => {
      expect(CALL_TYPE_COLORS.subscribe).toBe('#009688');
    });
  });

  test.describe('Status Colors', () => {
    test('healthy is green', () => {
      expect(STATUS_COLORS.healthy).toBe('#4CAF50');
    });

    test('degraded is yellow', () => {
      expect(STATUS_COLORS.degraded).toBe('#FFC107');
    });

    test('down is red', () => {
      expect(STATUS_COLORS.down).toBe('#F44336');
    });
  });
});
