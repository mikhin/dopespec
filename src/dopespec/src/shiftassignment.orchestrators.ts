import type { ShiftAssignmentProps } from '../generated/shiftassignment.types.js';

export function handleShiftAssignmentCreate(ctx: ShiftAssignmentProps, _payload: { memberId: string; positionId: string; startDate: string }): ShiftAssignmentProps {
  // TODO: validate policies (DailyPositionQuota, NoOverlappingShifts, NoTerminatedFutureShifts, WeeklyHoursLimit)
  // TODO: implement create
  return ctx;
}
