import { z } from 'zod';
import { ConditionSchema } from './condition.js';
import { ActionSchema } from './action.js';

export const RuleSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().default(0),
  if: ConditionSchema,
  then: ActionSchema,
});

export const RulesConfigSchema = z.object({
  version: z.string().default('1.0'),
  rules: z.array(RuleSchema),
  metadata: z.record(z.any()).optional(),
});