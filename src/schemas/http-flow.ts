/**
 * HTTP Flow Schema
 * Zod validation for HTTP flow visualization stories
 * Based on SPEC-030
 */

import { z } from 'zod';

// HTTP Methods
export const HttpMethodSchema = z.enum([
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
]);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// Participant types
export const ParticipantTypeSchema = z.enum([
  'client', 'server', 'service', 'external', 'gateway'
]);
export type ParticipantType = z.infer<typeof ParticipantTypeSchema>;

// Participant definition
export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ParticipantTypeSchema,
  icon: z.string().optional(),
  baseUrl: z.string().optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

// Auth definition
export const AuthDefSchema = z.object({
  type: z.enum(['bearer', 'basic', 'apiKey', 'oauth2', 'none']),
  token: z.string().optional(),
  location: z.enum(['header', 'query']).optional(),
});
export type AuthDef = z.infer<typeof AuthDefSchema>;

// Request definition
export const RequestDefSchema = z.object({
  from: z.string(),
  to: z.string(),
  method: HttpMethodSchema,
  path: z.string(),
  url: z.string().optional(),
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  bodyType: z.enum(['json', 'xml', 'form', 'text', 'binary']).optional(),
  auth: AuthDefSchema.optional(),
});
export type RequestDef = z.infer<typeof RequestDefSchema>;

// Redirect definition
export const RedirectDefSchema = z.object({
  location: z.string(),
  type: z.enum(['permanent', 'temporary']),
});

// Response definition
export const ResponseDefSchema = z.object({
  status: z.number().int().min(100).max(599),
  statusText: z.string().optional(),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  bodyType: z.enum(['json', 'xml', 'html', 'text', 'binary']).optional(),
  redirect: RedirectDefSchema.optional(),
});
export type ResponseDef = z.infer<typeof ResponseDefSchema>;

// Timing definition
export const TimingDefSchema = z.object({
  total: z.number(),
  dns: z.number().optional(),
  connect: z.number().optional(),
  tls: z.number().optional(),
  ttfb: z.number().optional(),
  download: z.number().optional(),
});
export type TimingDef = z.infer<typeof TimingDefSchema>;

// Exchange (request + response pair)
export const ExchangeSchema = z.object({
  id: z.string(),
  request: RequestDefSchema,
  response: ResponseDefSchema,
  timing: TimingDefSchema.optional(),
});
export type Exchange = z.infer<typeof ExchangeSchema>;

// Step definition
export const HttpFlowStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  narrative: z.string(),
  activeExchanges: z.array(z.string()),
  duration: z.number().optional(),
});
export type HttpFlowStep = z.infer<typeof HttpFlowStepSchema>;

// Complete HTTP Flow Story
export const HttpFlowStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  renderer: z.literal('http-flow'),
  schemaVersion: z.literal('2.0'),
  layout: z.enum(['sequence', 'waterfall']).optional(),
  participants: z.array(ParticipantSchema),
  exchanges: z.array(ExchangeSchema),
  steps: z.array(HttpFlowStepSchema),
});
export type HttpFlowStory = z.infer<typeof HttpFlowStorySchema>;

// Method colors
export const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string }> = {
  GET: { bg: '#E8F5E9', text: '#2E7D32' },
  POST: { bg: '#E3F2FD', text: '#1565C0' },
  PUT: { bg: '#FFF3E0', text: '#E65100' },
  PATCH: { bg: '#F3E5F5', text: '#7B1FA2' },
  DELETE: { bg: '#FFEBEE', text: '#C62828' },
  OPTIONS: { bg: '#FAFAFA', text: '#616161' },
  HEAD: { bg: '#FAFAFA', text: '#424242' },
};

// Status code colors
export function getStatusColor(status: number): { bg: string; text: string } {
  if (status >= 100 && status < 200) {
    return { bg: '#F5F5F5', text: '#757575' }; // Informational
  }
  if (status >= 200 && status < 300) {
    return { bg: '#E8F5E9', text: '#2E7D32' }; // Success
  }
  if (status >= 300 && status < 400) {
    return { bg: '#E3F2FD', text: '#1565C0' }; // Redirect
  }
  if (status >= 400 && status < 500) {
    return { bg: '#FFF3E0', text: '#E65100' }; // Client Error
  }
  if (status >= 500 && status < 600) {
    return { bg: '#FFEBEE', text: '#C62828' }; // Server Error
  }
  return { bg: '#FAFAFA', text: '#616161' };
}

// Status text lookup
export const STATUS_TEXT: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocols',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export function getStatusText(status: number): string {
  return STATUS_TEXT[status] || `Status ${status}`;
}

// Validate HTTP flow story
export function validateHttpFlowStory(data: unknown): HttpFlowStory {
  return HttpFlowStorySchema.parse(data);
}

// Participant type icons
export const PARTICIPANT_ICONS: Record<ParticipantType, string> = {
  client: '🌐',
  server: '⚙️',
  service: '🔧',
  external: '🌍',
};
