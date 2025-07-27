import type { Condition, ComparisonOperator, EvaluationContext } from '../types/index.js';
import { getValueByPath } from '../utils/path.js';

export function matchCondition(
  condition: Condition,
  context: EvaluationContext
): boolean {
  if ('and' in condition && condition.and) {
    return condition.and.every((cond: Condition) => matchCondition(cond, context));
  }
  
  if ('or' in condition && condition.or) {
    return condition.or.some((cond: Condition) => matchCondition(cond, context));
  }
  
  if ('not' in condition && condition.not) {
    return !matchCondition(condition.not, context);
  }
  
  return matchSimpleCondition(condition, context);
}

function matchSimpleCondition(
  condition: Record<string, any>,
  context: EvaluationContext
): boolean {
  for (const [key, value] of Object.entries(condition)) {
    const contextValue = getValueByPath(context, key);
    
    if (isComparisonOperator(value)) {
      if (!matchComparison(contextValue, value)) {
        return false;
      }
    } else {
      if (contextValue !== value) {
        return false;
      }
    }
  }
  
  return true;
}

function isComparisonOperator(value: any): value is ComparisonOperator {
  return value !== null && 
    typeof value === 'object' && 
    !Array.isArray(value) &&
    Object.keys(value).some(k => 
      ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'in', 'nin', 'contains', 'startsWith', 'endsWith'].includes(k)
    );
}

function matchComparison(value: any, operator: ComparisonOperator): boolean {
  if (operator.gt !== undefined && !(value > operator.gt)) return false;
  if (operator.gte !== undefined && !(value >= operator.gte)) return false;
  if (operator.lt !== undefined && !(value < operator.lt)) return false;
  if (operator.lte !== undefined && !(value <= operator.lte)) return false;
  if (operator.eq !== undefined && value !== operator.eq) return false;
  if (operator.neq !== undefined && value === operator.neq) return false;
  
  if (operator.in !== undefined && !operator.in.includes(value)) return false;
  if (operator.nin !== undefined && operator.nin.includes(value)) return false;
  
  if (typeof value === 'string') {
    if (operator.contains !== undefined && !value.includes(operator.contains)) return false;
    if (operator.startsWith !== undefined && !value.startsWith(operator.startsWith)) return false;
    if (operator.endsWith !== undefined && !value.endsWith(operator.endsWith)) return false;
  }
  
  return true;
}