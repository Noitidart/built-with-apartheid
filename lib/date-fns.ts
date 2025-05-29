import { isAfter, isEqual } from 'date-fns';

export function buildIsCreatedAtAfterOrEqual(date: Date | string | number) {
  return function isCreatedAtAfterOrEqual(inputs: { createdAt: Date }) {
    return isAfter(inputs.createdAt, date) || isEqual(inputs.createdAt, date);
  };
}
