import type { OrderProps } from './order.types.js';

export function OrderCancel(ctx: OrderProps): OrderProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot cancel: expected status 'pending', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'cancelled' };
}

export function OrderDeliver(ctx: OrderProps): OrderProps {
  if (ctx.status !== 'shipped') {
    throw new Error(`Cannot deliver: expected status 'shipped', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'delivered' };
}

export function OrderPay(ctx: OrderProps): OrderProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot pay: expected status 'pending', got '${ctx.status}'`);
  }
  if (!(ctx.total > 0)) {
    throw new Error('Guard failed for transition pay');
  }
  return { ...ctx, status: 'paid' };
}

export function OrderShip(ctx: OrderProps): OrderProps {
  if (ctx.status !== 'paid') {
    throw new Error(`Cannot ship: expected status 'paid', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'shipped' };
}
