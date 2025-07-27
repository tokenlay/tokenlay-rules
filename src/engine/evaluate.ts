import type { Rule, EvaluationContext, EvaluationResult, Action } from '../types/index.js';
import { matchCondition } from './matcher.js';
import { checkLimits } from './limiter.js';

export function evaluateRules(
  rules: Rule[],
  context: EvaluationContext
): EvaluationResult {
  const sortedRules = [...rules].sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return rules.indexOf(a) - rules.indexOf(b);
  });
  
  for (const rule of sortedRules) {
    if (matchCondition(rule.if, context)) {
      const limitResult = checkLimits(rule.then.limits, context);
      
      if (limitResult.exceeded && rule.then.on_limit_exceeded) {
        return createLimitExceededResult(rule, limitResult, rule.then.on_limit_exceeded);
      }
      
      const effectiveAction = determineAction(rule.then, limitResult.exceeded);
      
      return {
        matched: true,
        rule_id: rule.id,
        action: effectiveAction,
        model: rule.then.model,
        model_params: rule.then.model_params,
        limit_exceeded: limitResult.exceeded,
        limit_details: limitResult.exceeded && limitResult.limit ? {
          type: limitResult.limit.type,
          current: limitResult.current || 0,
          limit: limitResult.max || 0,
          window: limitResult.window || 'total',
        } : undefined,
        priority: rule.priority,
        custom_fields: rule.then.custom_fields,
      };
    }
  }
  
  return {
    matched: false,
    action: 'allow',
  };
}

function determineAction(action: Action, limitExceeded: boolean): EvaluationResult['action'] {
  if (limitExceeded) {
    return 'block';
  }
  return action.action || 'allow';
}

function createLimitExceededResult(
  rule: Rule,
  limitResult: ReturnType<typeof checkLimits>,
  onLimitExceeded: NonNullable<Action['on_limit_exceeded']>
): EvaluationResult {
  const baseResult: EvaluationResult = {
    matched: true,
    rule_id: rule.id,
    action: onLimitExceeded.action === 'downgrade' ? 'allow' : onLimitExceeded.action,
    limit_exceeded: true,
    priority: rule.priority,
  };
  
  if (onLimitExceeded.action === 'downgrade' && onLimitExceeded.downgrade_to) {
    baseResult.model = onLimitExceeded.downgrade_to;
  } else {
    baseResult.model = rule.then.model;
  }
  
  if (onLimitExceeded.error_code) {
    baseResult.error_code = onLimitExceeded.error_code;
  }
  
  if (onLimitExceeded.error_message) {
    baseResult.error_message = onLimitExceeded.error_message;
  }
  
  if (onLimitExceeded.http_status) {
    baseResult.http_status = onLimitExceeded.http_status;
  }
  
  if (limitResult.limit) {
    baseResult.limit_details = {
      type: limitResult.limit.type,
      current: limitResult.current || 0,
      limit: limitResult.max || 0,
      window: limitResult.window || 'total',
    };
  }
  
  return baseResult;
}