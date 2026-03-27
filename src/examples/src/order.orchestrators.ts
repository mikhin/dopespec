import type { OrderProps } from "../generated/order.types.js";

export function handleOrderAddItem(
  ctx: OrderProps,
  _payload: { productId: string; quantity: number },
): OrderProps {
  // TODO: validate policies (NoSuspendedCustomerOrders)
  // TODO: implement addItem
  return ctx;
}

export function handleOrderRemoveItem(
  ctx: OrderProps,
  _payload: { itemId: string },
): OrderProps {
  // TODO: implement removeItem
  return ctx;
}
