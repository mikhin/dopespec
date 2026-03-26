import type { OrderProps } from './order.types.js';

export function handleOrderAddItem(ctx: OrderProps, _payload: { productId: string; quantity: number }): OrderProps {
  // TODO: implement addItem
  return ctx;
}

export function handleOrderRemoveItem(ctx: OrderProps, _payload: { itemId: string }): OrderProps {
  // TODO: implement removeItem
  return ctx;
}
