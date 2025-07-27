# @tokenlay/rules

A smart rule engine for AI usage routing and cost control logic. This TypeScript library allows you to define declarative rules that match request contexts and determine model routing, rate limiting, and cost enforcement policies.

## Features

- **Declarative Rules**: Define conditions and actions in a simple, readable format
- **Smart Routing**: Route requests to different AI models based on user tier, usage, or custom criteria
- **Cost Control**: Enforce usage limits by requests, tokens, cost, or concurrent connections
- **Flexible Conditions**: Support for comparison operators, logical operators, and nested conditions
- **Window-based Limits**: Track usage across different time windows (minute, hour, day, month, year)
- **Graceful Degradation**: Downgrade to cheaper models when limits are exceeded
- **Type Safety**: Full TypeScript support with Zod schema validation

## Installation

```bash
npm install @tokenlay/rules
```

## Quick Start

```typescript
import { evaluateRules, type Rule, type EvaluationContext } from '@tokenlay/rules';

// Define your rules
const rules: Rule[] = [
  {
    id: 'free-tier',
    if: { tier: 'free' },
    then: {
      model: 'gpt-3.5-turbo',
      limits: [{
        type: 'requests',
        max: 100,
        window: 'day',
        per: 'user'
      }]
    },
    priority: 1
  },
  {
    id: 'pro-tier',
    if: { tier: 'pro' },
    then: {
      model: 'gpt-4',
      limits: [{
        type: 'cost',
        max: 50,
        window: 'month',
        per: 'user'
      }],
      on_limit_exceeded: {
        action: 'downgrade',
        downgrade_to: 'gpt-3.5-turbo'
      }
    },
    priority: 2
  }
];

// Evaluate against context
const context: EvaluationContext = {
  tier: 'pro',
  user: 'user123',
  usage: {
    requests: 50,
    tokens: 10000,
    cost: 45,
    concurrent: 2
  },
  windows: {}
};

const result = evaluateRules(rules, context);
console.log(result);
// { matched: true, rule_id: 'pro-tier', action: 'allow', model: 'gpt-4', ... }
```

## Rule Structure

### Conditions (`if`)

Support various matching patterns:

```typescript
// Simple equality
{ tier: 'free' }

// Comparison operators
{ 'usage.cost': { gte: 50 } }
{ requests: { lt: 100 } }
{ feature: { in: ['chat', 'completion'] } }

// Logical operators
{
  and: [
    { tier: 'enterprise' },
    { 'usage.cost': { lt: 1000 } }
  ]
}

{
  or: [
    { admin: true },
    { tier: { in: ['pro', 'enterprise'] } }
  ]
}

// Negation
{ not: { blocked: true } }
```

### Comparison Operators

- `gt`, `gte`, `lt`, `lte`: Numeric comparisons
- `eq`, `neq`: Equality checks
- `in`, `nin`: Array membership
- `contains`, `startsWith`, `endsWith`: String operations

### Actions (`then`)

Define what happens when a rule matches:

```typescript
{
  model: 'gpt-4',                    // Model to use
  model_params: { temperature: 0.7 }, // Model parameters
  action: 'allow',                    // allow | block | warn | queue
  limits: [{                          // Usage limits
    type: 'tokens',
    max: 100000,
    window: 'day',
    per: 'user'
  }],
  on_limit_exceeded: {                // What to do when limit hit
    action: 'downgrade',
    downgrade_to: 'gpt-3.5-turbo',
    error_message: 'Daily token limit exceeded'
  }
}
```

### Limit Types

- `requests`: Number of API requests
- `tokens`: Token consumption
- `cost`: Monetary cost
- `concurrent`: Concurrent connections

### Window Types

- `minute`, `hour`, `day`, `month`, `year`, `total`

## Advanced Usage

### Custom Tracking Keys

Group usage by custom fields:

```typescript
{
  limits: [{
    type: 'cost',
    max: 100,
    window: 'month',
    per: 'project',
    tracking_key: 'project_id'  // Use context.project_id for grouping
  }]
}
```

### Priority Resolution

Rules are evaluated by priority (higher first), then by order:

```typescript
const rules: Rule[] = [
  { if: { tier: 'free' }, then: { model: 'gpt-3.5' }, priority: 1 },
  { if: { tier: 'free', vip: true }, then: { model: 'gpt-4' }, priority: 10 }
];
// VIP free users get GPT-4
```

### Window-based Usage Tracking

Track usage across time windows:

```typescript
const context: EvaluationContext = {
  usage: { requests: 50, tokens: 10000, cost: 5, concurrent: 1 },
  windows: {
    'requests_hour_user_123': {
      current: 45,
      limit: 50,
      resets_at: '2025-07-27T15:00:00Z'
    }
  },
  // ... other fields
};
```

## API Reference

### `evaluateRules(rules: Rule[], context: EvaluationContext): EvaluationResult`

Main evaluation function that processes rules against context.

### Types

```typescript
interface Rule {
  id?: string;
  description?: string;
  priority?: number;
  if: Condition;
  then: Action;
}

interface EvaluationContext {
  usage: {
    requests: number;
    tokens: number;
    cost: number;
    concurrent: number;
  };
  windows: Record<string, WindowData>;
  [key: string]: any; // Custom fields
}

interface EvaluationResult {
  matched: boolean;
  rule_id?: string;
  action: 'allow' | 'block' | 'warn' | 'queue';
  model?: string;
  limit_exceeded?: boolean;
  error_code?: string;
  error_message?: string;
  // ... other fields
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck
```

## License

MIT