export function isNothingToDeleteError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'meta' in error &&
    typeof error.meta === 'object' &&
    error.meta !== null &&
    'cause' in error.meta &&
    error.meta.cause === 'Record to delete does not exist.'
  );
}
