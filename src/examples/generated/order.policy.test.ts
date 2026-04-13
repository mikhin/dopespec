import { describe, it, expect } from 'vitest';
import { validateNoSuspendedCustomerOrders } from './order.policies.js';
import type { NoSuspendedCustomerOrdersContext } from './order.policies.js';

describe('NoSuspendedCustomerOrders', () => {
  it('NoSuspendedCustomerOrders:rule_0: ctx.customer.status === \'suspended\' → prevent', () => {
    const ctx = {
      order: { createdAt: new Date(0), status: 'pending', total: 0, customerId: '', itemIds: [] },
      customer: { email: '', name: '', status: 'suspended' },
    };
    const result = validateNoSuspendedCustomerOrders(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoSuspendedCustomerOrders:rule_0');
  });

  it('NoSuspendedCustomerOrders:rule_1: ctx.customer.status === \'deleted\' → warn', () => {
    const ctx = {
      order: { createdAt: new Date(0), status: 'pending', total: 0, customerId: '', itemIds: [] },
      customer: { email: '', name: '', status: 'deleted' },
    };
    const result = validateNoSuspendedCustomerOrders(ctx);
    expect(result.warnings).toContain('NoSuspendedCustomerOrders:rule_1');
  });
});
