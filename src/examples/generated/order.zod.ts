import { z } from 'zod';

export const OrderSchema = z.object({
  createdAt: z.date(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
  total: z.number(),
  customerId: z.string(),
  itemIds: z.array(z.string()),
});
