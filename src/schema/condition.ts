import { z } from 'zod';

export const ComparisonOperatorSchema = z.object({
  gt: z.union([z.number(), z.string()]).optional(),
  gte: z.union([z.number(), z.string()]).optional(),
  lt: z.union([z.number(), z.string()]).optional(),
  lte: z.union([z.number(), z.string()]).optional(),
  eq: z.union([z.number(), z.string(), z.boolean()]).optional(),
  neq: z.union([z.number(), z.string(), z.boolean()]).optional(),
  in: z.array(z.union([z.number(), z.string()])).optional(),
  nin: z.array(z.union([z.number(), z.string()])).optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
});

export const SimpleConditionSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    ComparisonOperatorSchema,
  ])
);

export const LogicalOperatorSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    and: z.array(ConditionSchema).optional(),
    or: z.array(ConditionSchema).optional(),
    not: ConditionSchema.optional(),
  })
);

export const ConditionSchema = z.union([
  SimpleConditionSchema,
  LogicalOperatorSchema,
]);