import { describe, it, expect } from 'vitest';
import { validateDailyPositionQuota, validateNoOverlappingShifts, validateNoTerminatedFutureShifts, validateWeeklyHoursLimit } from './shiftassignment.policies.js';
import type { DailyPositionQuotaContext, NoOverlappingShiftsContext, NoTerminatedFutureShiftsContext, WeeklyHoursLimitContext } from './shiftassignment.policies.js';

describe('DailyPositionQuota', () => {
  it('DailyPositionQuota:rule_0: ctx.dayShifts.length > 0 → warn', () => {
    const ctx = {
      shiftassignment: { breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' },
      position: {},
      dayShifts: [{ breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' }],
    };
    const result = validateDailyPositionQuota(ctx);
    expect(result.warnings).toContain('DailyPositionQuota:rule_0');
  });
});

describe('NoOverlappingShifts', () => {
  it('NoOverlappingShifts:rule_0: ctx.existingShifts.length > 0 → prevent', () => {
    const ctx = {
      shiftassignment: { breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' },
      member: {},
      existingShifts: [{ breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' }],
    };
    const result = validateNoOverlappingShifts(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoOverlappingShifts:rule_0');
  });
});

describe('NoTerminatedFutureShifts', () => {
  it('NoTerminatedFutureShifts:rule_0: ctx.member.isTerminated === true → prevent', () => {
    const ctx = {
      shiftassignment: { breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' },
      member: {},
    };
    const result = validateNoTerminatedFutureShifts(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoTerminatedFutureShifts:rule_0');
  });
});

describe('WeeklyHoursLimit', () => {
  it('WeeklyHoursLimit:rule_0: ctx.weekShifts.length > 0 → warn', () => {
    const ctx = {
      shiftassignment: { breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' },
      member: {},
      weekShifts: [{ breakMinutes: 0, endTime: '', id: '', memberId: '', positionId: '', startDate: '', startTime: '', memberId: '', positionId: '' }],
    };
    const result = validateWeeklyHoursLimit(ctx);
    expect(result.warnings).toContain('WeeklyHoursLimit:rule_0');
  });
});
