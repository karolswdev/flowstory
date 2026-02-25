import YAML from 'yaml';
import fs from 'fs';
import { z } from 'zod';

// Exact reproduction from src/schemas/service-flow.ts
const SERVICE_TYPES = ['api', 'worker', 'gateway', 'database', 'cache', 'external', 'event-bus', 'workflow', 'event-processor'];
const HEALTH_STATUSES = ['healthy', 'degraded', 'down'];
const QUEUE_TYPES = ['queue', 'topic', 'stream'];
const BROKER_TYPES = ['rabbitmq', 'kafka', 'sqs', 'servicebus', 'redis'];
const CALL_TYPES = ['sync', 'async', 'publish', 'subscribe'];
const PROTOCOLS = ['http', 'grpc', 'graphql'];
const LAYOUTS = ['sequence'];

const ProtocolSchema = z.enum(PROTOCOLS);
const ServiceDefSchema = z.object({
  id: z.string(), name: z.string(), type: z.enum(SERVICE_TYPES),
  technology: z.string().optional(), status: z.enum(HEALTH_STATUSES).optional(),
  instances: z.number().int().positive().optional(), version: z.string().optional(),
  tags: z.record(z.string(), z.string()).optional(),
});
const QueueDefSchema = z.object({
  id: z.string(), name: z.string(), type: z.enum(QUEUE_TYPES),
  broker: z.enum(BROKER_TYPES).optional(), depth: z.number().int().optional(),
  consumers: z.number().int().optional(), tags: z.record(z.string(), z.string()).optional(),
});
const ResponseSchema = z.object({
  status: z.union([z.number(), z.string()]), label: z.string().optional(),
});
const SyncCallSchema = z.object({
  id: z.string(), type: z.literal('sync'), from: z.string(), to: z.string(),
  method: z.string().optional(), path: z.string().optional(),
  protocol: ProtocolSchema.optional(), duration: z.number().optional(),
  status: z.union([z.number(), z.enum(['ok', 'error'])]).optional(),
  payload: z.unknown().optional(), response: ResponseSchema.optional(),
});
const AsyncCallSchema = z.object({
  id: z.string(), type: z.literal('async'), from: z.string(), to: z.string(),
  messageType: z.string(), payload: z.unknown().optional(),
  correlationId: z.string().optional(),
});
const PublishCallSchema = z.object({
  id: z.string(), type: z.literal('publish'), from: z.string(), to: z.string(),
  messageType: z.string(), payload: z.unknown().optional(),
});
const SubscribeCallSchema = z.object({
  id: z.string(), type: z.literal('subscribe'), from: z.string(), to: z.string(),
  messageType: z.string(), action: z.string().optional(),
});
const CallDefSchema = z.discriminatedUnion('type', [
  SyncCallSchema, AsyncCallSchema, PublishCallSchema, SubscribeCallSchema,
]);
const ZoneDefSchema = z.object({
  id: z.string(), label: z.string(), members: z.array(z.string()),
  color: z.string().optional(),
});
const ServiceFlowStepSchema = z.object({
  id: z.string(), title: z.string(), narrative: z.string(),
  activeCalls: z.array(z.string()),
  focusNodes: z.array(z.string()).optional().default([]),
  revealNodes: z.array(z.string()).optional().default([]),
  revealCalls: z.array(z.string()).optional().default([]),
  duration: z.number().optional(),
  narration: z.object({ speaker: z.string(), message: z.string() }).optional(),
});
const ServiceFlowStorySchema = z.object({
  id: z.string(), title: z.string(), description: z.string().optional(),
  renderer: z.literal('service-flow'), schemaVersion: z.literal('2.0'),
  layout: z.enum(LAYOUTS).optional().default('sequence'),
  services: z.array(ServiceDefSchema),
  queues: z.array(QueueDefSchema).optional().default([]),
  calls: z.array(CallDefSchema),
  zones: z.array(ZoneDefSchema).optional().default([]),
  steps: z.array(ServiceFlowStepSchema),
});

// Test files
const files = [
  'stories/composite/trip-ops-domain-model.yaml',
  'stories/composite/trip-ops-domain-blueprint.yaml',
  'stories/composite/trip-ops-execution-pipeline.yaml',
  'stories/composite/trip-ops-event-architecture.yaml',
];

for (const file of files) {
  console.log(`\n=== ${file} ===`);
  const yaml = fs.readFileSync(file, 'utf8');
  const data = YAML.parse(yaml);

  for (const [si, section] of data.sections.entries()) {
    // Build miniStory exactly like composite.ts does (line 65-74)
    const { renderer: _r, title: _t, accentColor: _a, ...rest } = section;
    const miniStory = {
      ...rest,
      id: `${data.id}-section-${si}`,
      renderer: section.renderer,
      type: section.renderer,
      schemaVersion: data.schemaVersion || '2.0',
      version: data.version || 2,
      title: section.title,
    };

    const result = ServiceFlowStorySchema.safeParse(miniStory);
    if (!result.success) {
      console.log(`  FAIL Section ${si} (${section.title}):`);
      for (const issue of result.error.issues) {
        console.log(`    [${issue.code}] ${issue.path.join('.')}: ${issue.message}`);
      }
    } else {
      console.log(`  OK Section ${si} (${section.title}) — ${section.steps.length} steps`);
    }
  }
}
