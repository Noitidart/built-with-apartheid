export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function toId<UInput extends { id: UId }, UId extends string>(
  inputs: UInput
): UId {
  return inputs.id;
}

export function assertNonNullArray<UItem>(
  items: UItem[]
): asserts items is Array<NonNullable<UItem>> {
  if (items.some(isNullish)) {
    throw new Error('Array contains nullish items');
  }
}

export function isNullish<UItem>(
  item: UItem | null | undefined
): item is null | undefined {
  return item === null || item === undefined;
}
export const isFalsy = isNullish;

export function isNonNullish<UItem>(item: UItem): item is NonNullable<UItem> {
  return item !== null && item !== undefined;
}
export const isTruthy = isNonNullish;
