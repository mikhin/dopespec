import { z } from 'zod';

export const ShiftAssignmentSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  positionId: z.string(),
  startDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number().optional(),
  memberId: z.string(),
  positionId: z.string(),
});
