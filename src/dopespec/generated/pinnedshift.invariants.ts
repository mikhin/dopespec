import type { PinnedShiftProps } from './pinnedshift.types.js';

export function validateCannotEditDeletedPin(ctx: PinnedShiftProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'deleted');
}

export function validateCannotEditThisOnlyDeletedPin(ctx: PinnedShiftProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'deleted');
}

export function validateCannotDeleteOccurrenceFromDeletedPin(ctx: PinnedShiftProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'deleted');
}

export function validateCannotUnpinDeletedPin(ctx: PinnedShiftProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'deleted');
}

export function validatePinnedShift(ctx: PinnedShiftProps): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  if (!validateCannotEditDeletedPin(ctx)) violations.push('cannotEditDeletedPin');
  if (!validateCannotEditThisOnlyDeletedPin(ctx)) violations.push('cannotEditThisOnlyDeletedPin');
  if (!validateCannotDeleteOccurrenceFromDeletedPin(ctx)) violations.push('cannotDeleteOccurrenceFromDeletedPin');
  if (!validateCannotUnpinDeletedPin(ctx)) violations.push('cannotUnpinDeletedPin');
  return { valid: violations.length === 0, violations };
}
