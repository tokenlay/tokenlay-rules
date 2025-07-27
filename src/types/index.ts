import type { z } from 'zod';
import type {
  ComparisonOperatorSchema,
  SimpleConditionSchema,
  LogicalOperatorSchema,
  ConditionSchema,
  LimitTypeSchema,
  WindowTypeSchema,
  ActionTypeSchema,
  LimitSchema,
  NotificationSchema,
  OnLimitExceededSchema,
  ActionSchema,
  RuleSchema,
  RulesConfigSchema,
  UsageSchema,
  WindowDataSchema,
  EvaluationContextSchema,
  EvaluationResultSchema,
} from '../schema/index.js';

export type ComparisonOperator = z.infer<typeof ComparisonOperatorSchema>;
export type SimpleCondition = z.infer<typeof SimpleConditionSchema>;
export type LogicalOperator = z.infer<typeof LogicalOperatorSchema>;
export type Condition = z.infer<typeof ConditionSchema>;

export type LimitType = z.infer<typeof LimitTypeSchema>;
export type WindowType = z.infer<typeof WindowTypeSchema>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export type Limit = z.infer<typeof LimitSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type OnLimitExceeded = z.infer<typeof OnLimitExceededSchema>;
export type Action = z.infer<typeof ActionSchema>;

export type Rule = z.infer<typeof RuleSchema>;
export type RulesConfig = z.infer<typeof RulesConfigSchema>;

export type Usage = z.infer<typeof UsageSchema>;
export type WindowData = z.infer<typeof WindowDataSchema>;
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;