import { z } from 'zod';

export const LimitTypeSchema = z.enum(['requests', 'tokens', 'cost', 'concurrent']);

export const WindowTypeSchema = z.enum(['minute', 'hour', 'day', 'month', 'year', 'total']);

export const ActionTypeSchema = z.enum(['allow', 'block', 'warn', 'queue']);

export const LimitSchema = z.object({
  type: LimitTypeSchema,
  max: z.number().positive(),
  window: WindowTypeSchema,
  per: z.string(),
  tracking_key: z.string().optional(),
});

export const NotificationSchema = z.object({
  type: z.enum(['webhook', 'email', 'slack']),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
  channel: z.string().optional(),
  payload: z.record(z.any()).optional(),
});

export const OnLimitExceededSchema = z.object({
  action: z.enum(['block', 'downgrade', 'warn', 'queue']),
  downgrade_to: z.string().optional(),
  delay_seconds: z.number().positive().optional(),
  retry_after_seconds: z.number().positive().optional(),
  notify: z.array(NotificationSchema).optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  http_status: z.number().min(100).max(599).optional(),
});

export const ActionSchema = z.object({
  model: z.string().optional(),
  model_params: z.record(z.any()).optional(),
  action: ActionTypeSchema.optional(),
  priority_modifier: z.number().optional(),
  limits: z.array(LimitSchema).optional(),
  on_limit_exceeded: OnLimitExceededSchema.optional(),
  custom_fields: z.record(z.any()).optional(),
});