/**
 * Casts query param string to boolean - "true" becomes true, everything else becomes false
 */
export function castQueryParamToBoolean(val: string | undefined): boolean {
  return val === 'true';
}
