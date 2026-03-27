import { z } from 'zod';

export const PinnedShiftSchema = z.object({
  memberId: z.string(),
  positionId: z.string(),
  departmentId: z.string(),
  shiftTypeId: z.string(),
  dayOfWeek: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  activeFrom: z.date(),
  breakMinutes: z.number(),
  status: z.enum(['active', 'deleted']),
  memberId: z.string(),
  departmentId: z.string(),
  positionId: z.string(),
  shiftTypeId: z.string(),
  materializedAssignmentsIds: z.array(z.string()),
});
