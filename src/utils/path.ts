export function getValueByPath(obj: any, path: string): any {
  if (!path || typeof path !== 'string') return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

export function setValueByPath(obj: any, path: string, value: any): void {
  if (!path || typeof path !== 'string') return;
  
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  if (!lastKey) return;
  
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}