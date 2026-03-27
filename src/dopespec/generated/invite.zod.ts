import { z } from 'zod';

export const InviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
  createdAt: z.date(),
  expiresAt: z.date(),
  organizationId: z.string(),
  memberId: z.string(),
});
