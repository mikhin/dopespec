import { z } from 'zod';

export const CustomerSchema = z.object({
  email: z.string(),
  name: z.string(),
  status: z.enum(['active', 'suspended', 'deleted']),
});
