/**
 * Casts query param string to boolean - "true" becomes true, everything else becomes false
 */
export function castQueryParamToBoolean(val: string | undefined): boolean {
  return val === 'true';
}

/**
 * Casts query param string to number, throwing if invalid
 * Useful for parsing numeric IDs from URL parameters
 */
export function castQueryParamAsNumber(val: string): number {
  const parsed = Number(val);
  if (Number.isNaN(parsed)) {
    throw new Error('NOT_A_NUMBER');
  }
  return parsed;
}
