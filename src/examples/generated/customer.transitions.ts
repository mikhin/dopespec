import type { CustomerProps } from './customer.types.js';

export function CustomerDelete(ctx: CustomerProps): CustomerProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot delete: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'deleted' };
}

export function CustomerReactivate(ctx: CustomerProps): CustomerProps {
  if (ctx.status !== 'suspended') {
    throw new Error(`Cannot reactivate: expected status 'suspended', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'active' };
}

export function CustomerSuspend(ctx: CustomerProps): CustomerProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot suspend: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'suspended' };
}
