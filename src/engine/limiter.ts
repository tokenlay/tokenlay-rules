import type { Limit, EvaluationContext, WindowType } from '../types/index.js';
import { getValueByPath } from '../utils/path.js';

export interface LimitCheckResult {
  exceeded: boolean;
  limit?: Limit;
  current?: number;
  max?: number;
  window?: WindowType;
}

export function checkLimits(
  limits: Limit[] | undefined,
  context: EvaluationContext
): LimitCheckResult {
  if (!limits || limits.length === 0) {
    return { exceeded: false };
  }
  
  for (const limit of limits) {
    const result = checkLimit(limit, context);
    if (result.exceeded) {
      return result;
    }
  }
  
  return { exceeded: false };
}

function checkLimit(
  limit: Limit,
  context: EvaluationContext
): LimitCheckResult {
  const trackingKey = generateTrackingKey(limit, context);
  const windowData = context.windows[trackingKey];
  
  if (!windowData) {
    const current = getCurrentUsageValue(limit.type, context);
    return {
      exceeded: current >= limit.max,
      limit,
      current,
      max: limit.max,
      window: limit.window,
    };
  }
  
  const isExpired = new Date(windowData.resets_at) <= new Date();
  if (isExpired) {
    return { exceeded: false };
  }
  
  return {
    exceeded: windowData.current >= windowData.limit,
    limit,
    current: windowData.current,
    max: windowData.limit,
    window: limit.window,
  };
}

function generateTrackingKey(limit: Limit, context: EvaluationContext): string {
  const baseKey = `${limit.type}_${limit.window}_${limit.per}`;
  
  if (limit.tracking_key) {
    const trackingValue = getValueByPath(context, limit.tracking_key);
    return `${baseKey}_${trackingValue}`;
  }
  
  const perValue = getValueByPath(context, limit.per);
  if (perValue !== undefined) {
    return `${baseKey}_${perValue}`;
  }
  
  return baseKey;
}

function getCurrentUsageValue(
  type: Limit['type'],
  context: EvaluationContext
): number {
  switch (type) {
    case 'requests':
      return context.usage.requests;
    case 'tokens':
      return context.usage.tokens;
    case 'cost':
      return context.usage.cost;
    case 'concurrent':
      return context.usage.concurrent;
    default:
      return 0;
  }
}