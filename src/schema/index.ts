export * from './condition.js';
export * from './action.js';
export * from './rule.js';
export * from './context.js';

import { z } from 'zod';
import { ActionTypeSchema } from './action.js';

export const EvaluationResultSchema = z.object({
  matched: z.boolean(),
  rule_id: z.string().optional(),
  action: ActionTypeSchema,
  model: z.string().optional(),
  model_params: z.record(z.any()).optional(),
  limit_exceeded: z.boolean().optional(),
  limit_details: z.object({
    type: z.string(),
    current: z.number(),
    limit: z.number(),
    window: z.string(),
  }).optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  http_status: z.number().optional(),
  priority: z.number().optional(),
  custom_fields: z.record(z.any()).optional(),
});