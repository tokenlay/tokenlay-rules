import { describe, it, expect } from 'vitest';
import { evaluateRules } from '../src/index.js';
import type { Rule, EvaluationContext } from '../src/index.js';

describe('evaluateRules', () => {
  it('should route based on tier (free vs pro)', () => {
    const rules: Rule[] = [
      {
        if: { tier: 'free' },
        then: { model: 'gpt-3.5-turbo', action: 'allow' },
        priority: 1,
      },
      {
        if: { tier: 'pro' },
        then: { model: 'gpt-4', action: 'allow' },
        priority: 1,
      },
    ];
    
    const freeContext: EvaluationContext = {
      tier: 'free',
      usage: { requests: 0, tokens: 0, cost: 0, concurrent: 0 },
      windows: {},
    };
    
    const proContext: EvaluationContext = {
      tier: 'pro',
      usage: { requests: 0, tokens: 0, cost: 0, concurrent: 0 },
      windows: {},
    };
    
    const freeResult = evaluateRules(rules, freeContext);
    expect(freeResult.matched).toBe(true);
    expect(freeResult.model).toBe('gpt-3.5-turbo');
    expect(freeResult.action).toBe('allow');
    
    const proResult = evaluateRules(rules, proContext);
    expect(proResult.matched).toBe(true);
    expect(proResult.model).toBe('gpt-4');
    expect(proResult.action).toBe('allow');
  });
  
  it('should block requests when over limit', () => {
    const rules: Rule[] = [
      {
        if: { tier: 'free' },
        then: {
          model: 'gpt-3.5-turbo',
          action: 'allow',
          limits: [
            {
              type: 'requests',
              max: 100,
              window: 'hour',
              per: 'user',
            },
          ],
        },
        priority: 0,
      },
    ];
    
    const context: EvaluationContext = {
      tier: 'free',
      user: 'user123',
      usage: { requests: 150, tokens: 0, cost: 0, concurrent: 0 },
      windows: {},
    };
    
    const result = evaluateRules(rules, context);
    expect(result.matched).toBe(true);
    expect(result.action).toBe('block');
    expect(result.limit_exceeded).toBe(true);
    expect(result.limit_details).toMatchObject({
      type: 'requests',
      current: 150,
      limit: 100,
    });
  });
  
  it('should downgrade model when tokens exceeded', () => {
    const rules: Rule[] = [
      {
        if: { tier: 'pro' },
        then: {
          model: 'gpt-4',
          action: 'allow',
          limits: [
            {
              type: 'tokens',
              max: 50000,
              window: 'day',
              per: 'user',
            },
          ],
          on_limit_exceeded: {
            action: 'downgrade',
            downgrade_to: 'gpt-3.5-turbo',
          },
        },
        priority: 0,
      },
    ];
    
    const context: EvaluationContext = {
      tier: 'pro',
      user: 'user456',
      usage: { requests: 0, tokens: 60000, cost: 0, concurrent: 0 },
      windows: {},
    };
    
    const result = evaluateRules(rules, context);
    expect(result.matched).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.model).toBe('gpt-3.5-turbo');
    expect(result.limit_exceeded).toBe(true);
  });
  
  it('should support custom group-by logic with tracking_key', () => {
    const rules: Rule[] = [
      {
        if: { feature: { in: ['chat', 'completion'] } },
        then: {
          model: 'gpt-3.5-turbo',
          action: 'allow',
          limits: [
            {
              type: 'cost',
              max: 10,
              window: 'month',
              per: 'project',
              tracking_key: 'project_id',
            },
          ],
        },
        priority: 0,
      },
    ];
    
    const context: EvaluationContext = {
      feature: 'chat',
      project_id: 'proj_123',
      usage: { requests: 0, tokens: 0, cost: 5, concurrent: 0 },
      windows: {
        'cost_month_project_proj_123': {
          current: 8,
          limit: 10,
          resets_at: '2025-08-01T00:00:00Z',
        },
      },
    };
    
    const result = evaluateRules(rules, context);
    expect(result.matched).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.limit_exceeded).toBe(false);
    
    context.windows['cost_month_project_proj_123']!.current = 11;
    const exceededResult = evaluateRules(rules, context);
    expect(exceededResult.matched).toBe(true);
    expect(exceededResult.action).toBe('block');
    expect(exceededResult.limit_exceeded).toBe(true);
  });
  
  it('should resolve multiple matching rules with priority', () => {
    const rules: Rule[] = [
      {
        id: 'rule1',
        if: { tier: 'pro' },
        then: { model: 'gpt-3.5-turbo', action: 'allow' },
        priority: 1,
      },
      {
        id: 'rule2',
        if: { tier: 'pro', feature: 'advanced' },
        then: { model: 'gpt-4', action: 'allow' },
        priority: 10,
      },
      {
        id: 'rule3',
        if: { tier: 'pro' },
        then: { model: 'claude-2', action: 'allow' },
        priority: 5,
      },
    ];
    
    const context: EvaluationContext = {
      tier: 'pro',
      feature: 'advanced',
      usage: { requests: 0, tokens: 0, cost: 0, concurrent: 0 },
      windows: {},
    };
    
    const result = evaluateRules(rules, context);
    expect(result.matched).toBe(true);
    expect(result.rule_id).toBe('rule2');
    expect(result.model).toBe('gpt-4');
    expect(result.priority).toBe(10);
  });
  
  it('should handle complex logical conditions', () => {
    const rules: Rule[] = [
      {
        if: {
          and: [
            { tier: 'enterprise' },
            {
              or: [
                { 'usage.cost': { lt: 100 } },
                { admin: true },
              ],
            },
          ],
        },
        then: { model: 'gpt-4-32k', action: 'allow' },
        priority: 0,
      },
    ];
    
    const contextUnderBudget: EvaluationContext = {
      tier: 'enterprise',
      admin: false,
      usage: { requests: 0, tokens: 0, cost: 50, concurrent: 0 },
      windows: {},
    };
    
    const contextAdmin: EvaluationContext = {
      tier: 'enterprise',
      admin: true,
      usage: { requests: 0, tokens: 0, cost: 150, concurrent: 0 },
      windows: {},
    };
    
    const contextNeither: EvaluationContext = {
      tier: 'enterprise',
      admin: false,
      usage: { requests: 0, tokens: 0, cost: 150, concurrent: 0 },
      windows: {},
    };
    
    expect(evaluateRules(rules, contextUnderBudget).matched).toBe(true);
    expect(evaluateRules(rules, contextAdmin).matched).toBe(true);
    expect(evaluateRules(rules, contextNeither).matched).toBe(false);
  });
  
  it('should handle window expiry correctly', () => {
    const rules: Rule[] = [
      {
        if: { tier: 'free' },
        then: {
          model: 'gpt-3.5-turbo',
          action: 'allow',
          limits: [
            {
              type: 'requests',
              max: 10,
              window: 'hour',
              per: 'user',
            },
          ],
        },
        priority: 0,
      },
    ];
    
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    
    const contextExpired: EvaluationContext = {
      tier: 'free',
      user: 'user789',
      usage: { requests: 5, tokens: 0, cost: 0, concurrent: 0 },
      windows: {
        'requests_hour_user_user789': {
          current: 15,
          limit: 10,
          resets_at: pastDate,
        },
      },
    };
    
    const contextActive: EvaluationContext = {
      tier: 'free',
      user: 'user789',
      usage: { requests: 5, tokens: 0, cost: 0, concurrent: 0 },
      windows: {
        'requests_hour_user_user789': {
          current: 15,
          limit: 10,
          resets_at: futureDate,
        },
      },
    };
    
    const expiredResult = evaluateRules(rules, contextExpired);
    expect(expiredResult.matched).toBe(true);
    expect(expiredResult.action).toBe('allow');
    expect(expiredResult.limit_exceeded).toBe(false);
    
    const activeResult = evaluateRules(rules, contextActive);
    expect(activeResult.matched).toBe(true);
    expect(activeResult.action).toBe('block');
    expect(activeResult.limit_exceeded).toBe(true);
  });
});