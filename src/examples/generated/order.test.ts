import { describe, it, expect } from "vitest";
import type { OrderProps } from "./order.types.js";
import { OrderPay } from "./order.transitions.js";

describe("Order", () => {
  it('given {"total":100}, when pay, then status = paid', () => {
    const ctx = {
      createdAt: new Date(0),
      total: 100,
      status: "pending",
      customerId: "",
      itemIds: [],
    } satisfies OrderProps;
    const result = OrderPay(ctx);
    expect(result.status).toBe("paid");
  });

  it('given {"total":0}, when pay, then stays pending', () => {
    const ctx = {
      createdAt: new Date(0),
      total: 0,
      status: "pending",
      customerId: "",
      itemIds: [],
    } satisfies OrderProps;
    expect(() => OrderPay(ctx)).toThrow();
  });
});
