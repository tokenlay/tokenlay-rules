import { z } from 'zod';

export const UsageSchema = z.object({
  requests: z.number().nonnegative().default(0),
  tokens: z.number().nonnegative().default(0),
  cost: z.number().nonnegative().default(0),
  concurrent: z.number().nonnegative().default(0),
});

export const WindowDataSchema = z.object({
  current: z.number().nonnegative(),
  limit: z.number().positive(),
  resets_at: z.string().datetime(),
});

export const EvaluationContextSchema = z.object({
  usage: UsageSchema,
  windows: z.record(z.string(), WindowDataSchema).default({}),
}).catchall(z.any());