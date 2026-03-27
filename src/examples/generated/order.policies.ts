import type { CustomerProps } from "./customer.types.js";
import type { OrderProps } from "./order.types.js";

export type NoSuspendedCustomerOrdersContext = {
  order: OrderProps;
  customer: CustomerProps;
};

export function validateNoSuspendedCustomerOrders(
  ctx: NoSuspendedCustomerOrdersContext,
): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.customer.status === "suspended")
    violations.push("NoSuspendedCustomerOrders:rule_0");
  if (ctx.customer.status === "deleted")
    warnings.push("NoSuspendedCustomerOrders:rule_1");
  return { valid: violations.length === 0, violations, warnings };
}
