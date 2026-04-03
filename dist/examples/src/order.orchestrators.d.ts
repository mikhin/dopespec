import type { OrderProps } from "../generated/order.types.js";
export declare function handleOrderAddItem(ctx: OrderProps, _payload: {
    productId: string;
    quantity: number;
}): OrderProps;
export declare function handleOrderRemoveItem(ctx: OrderProps, _payload: {
    itemId: string;
}): OrderProps;
//# sourceMappingURL=order.orchestrators.d.ts.map