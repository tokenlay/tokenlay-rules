# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm install          # Install dependencies
npm run build        # Build TypeScript to dist/
npm run dev          # Build in watch mode
npm test             # Run tests with Vitest
npm run test:ui      # Run tests with Vitest UI
npm run test:coverage # Run tests with coverage report
npm run lint         # Lint with ESLint
npm run typecheck    # Type check without building
```

### Running Single Tests
```bash
npx vitest -t "test name pattern"  # Run tests matching pattern
npx vitest path/to/test.ts        # Run specific test file
```

## Architecture Overview

This is a **stateless rule engine** for AI usage routing and cost control. The engine evaluates declarative rules against contexts to determine model routing and enforce limits.

### Core Components

1. **Schemas** (`src/schema/`): Zod schemas define and validate all data structures
   - `condition.ts`: Matching patterns (equality, comparison, logical operators)
   - `action.ts`: What happens when rules match (model selection, limits, fallbacks)
   - `rule.ts`: Complete rule structure with if/then
   - `context.ts`: Runtime data including usage and window tracking

2. **Types** (`src/types/`): TypeScript types inferred from Zod schemas

3. **Engine** (`src/engine/`):
   - `evaluate.ts`: Main entry point - evaluates rules by priority
   - `matcher.ts`: Recursive condition matching with dot notation support
   - `limiter.ts`: Checks usage limits against windows or raw usage

### Key Design Decisions

#### Stateless Window Tracking
The engine doesn't track time windows itself. Instead:
- Rules define limits with windows (e.g., "50k tokens per day")
- The calling system tracks usage over time
- Window data is passed in `context.windows` with current usage and reset times
- If no window data exists, falls back to checking raw `usage` values

Example context with window tracking:
```typescript
{
  usage: { tokens: 60000, ... },  // Total usage (fallback)
  windows: {
    'tokens_day_user_123': {      // Tracked by caller
      current: 45000,
      limit: 50000,
      resets_at: '2025-07-28T00:00:00Z'
    }
  }
}
```

#### Priority-based Evaluation
- Rules are sorted by priority (higher first)
- First matching rule wins
- Same priority: earlier in array wins

#### Dot Notation Paths
Conditions support nested property access:
- `{ 'usage.cost': { lt: 100 } }` checks `context.usage.cost < 100`
- Implemented in `utils/path.ts`

## Testing Approach

Tests use Vitest and cover:
- Tier-based routing
- Limit enforcement (with and without window data)
- Model downgrade on limit exceeded
- Priority resolution
- Complex logical conditions
- Window expiry

Note: Many tests demonstrate the fallback behavior where window tracking isn't provided, so limits check against raw usage values.