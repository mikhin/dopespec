import type { OrderProps } from './order.types.js';

export function validateCannotAddWhenCancelled(ctx: OrderProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'cancelled');
}

export function validateCannotRemoveWhenEmpty(ctx: OrderProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.total === 0);
}

export function validateOrder(ctx: OrderProps): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  if (!validateCannotAddWhenCancelled(ctx)) violations.push('cannotAddWhenCancelled');
  if (!validateCannotRemoveWhenEmpty(ctx)) violations.push('cannotRemoveWhenEmpty');
  return { valid: violations.length === 0, violations };
}
