import type { ScheduleMemberProps } from './schedulemember.types.js';
import type { SchedulePositionProps } from './scheduleposition.types.js';
import type { ShiftAssignmentProps } from './shiftassignment.types.js';

export type DailyPositionQuotaContext = {
  shiftassignment: ShiftAssignmentProps;
  position: SchedulePositionProps;
  dayShifts: ShiftAssignmentProps[];
};

export function validateDailyPositionQuota(ctx: DailyPositionQuotaContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.dayShifts.length > 0) warnings.push('DailyPositionQuota:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoOverlappingShiftsContext = {
  shiftassignment: ShiftAssignmentProps;
  member: ScheduleMemberProps;
  existingShifts: ShiftAssignmentProps[];
};

export function validateNoOverlappingShifts(ctx: NoOverlappingShiftsContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.existingShifts.length > 0) violations.push('NoOverlappingShifts:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoTerminatedFutureShiftsContext = {
  shiftassignment: ShiftAssignmentProps;
  member: ScheduleMemberProps;
};

export function validateNoTerminatedFutureShifts(ctx: NoTerminatedFutureShiftsContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member.isTerminated === true) violations.push('NoTerminatedFutureShifts:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type WeeklyHoursLimitContext = {
  shiftassignment: ShiftAssignmentProps;
  member: ScheduleMemberProps;
  weekShifts: ShiftAssignmentProps[];
};

export function validateWeeklyHoursLimit(ctx: WeeklyHoursLimitContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.weekShifts.length > 0) warnings.push('WeeklyHoursLimit:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}
