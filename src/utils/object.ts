export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

export const deepMerge = <T>(base: T, override: unknown): T => {
  if (override === undefined || override === null) {
    return deepClone(base);
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return deepClone(override as T);
  }

  if (typeof base !== 'object' || typeof override !== 'object') {
    return deepClone(override as T);
  }

  const output: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const current = output[key];
    output[key] = current && typeof current === 'object' && value && typeof value === 'object'
      ? deepMerge(current, value)
      : deepClone(value);
  }

  return output as T;
};
