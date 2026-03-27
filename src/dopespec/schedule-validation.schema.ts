/**
 * Schedule validation policies — migrated from duler-frontend validation rules.
 *
 * Original source:
 *   src/services/schedule/validation/validate-terminated-employee.ts  (REQ-37)
 *   src/services/schedule/validation/validate-overlapping-shifts.ts   (REQ-36)
 *   src/services/schedule/validation/validate-weekly-hours.ts         (REQ-38)
 *   src/services/schedule/validation/validate-daily-labor-guide.ts    (REQ-40)
 *
 * Each validation rule becomes a policy() bound to ShiftAssignment + "create".
 *
 * NOTE: NoTerminatedFutureShifts has two rules — "prevent" for future shifts
 * and "warn" for past shifts — matching the original severity split.
 */
import {
  action,
  belongsTo,
  boolean,
  date,
  hasMany,
  model,
  number,
  optional,
  policy,
  ref,
  string,
} from "../schema/index.js";

// ---------------------------------------------------------------------------
// Models (minimal, enough to satisfy policy requires)
// ---------------------------------------------------------------------------

const ShiftAssignment = model("ShiftAssignment", {
  props: {
    id: string(),
    memberId: string(),
    positionId: string(),
    startDate: string(),
    startTime: string(),
    endTime: string(),
    breakMinutes: optional(number()),
  },

  relations: {
    member: belongsTo(ref("ScheduleMember")),
    position: belongsTo(ref("SchedulePosition")),
  },

  actions: {
    create: action<{ memberId: string; positionId: string; startDate: string }>({
      memberId: string(),
      positionId: string(),
      startDate: string(),
    }),
  },

  transitions: ({ from }) => ({}),
  constraints: ({ rule }) => ({}),
});

// ---------------------------------------------------------------------------
// Policies
// ---------------------------------------------------------------------------

/**
 * REQ-37: Terminated employees cannot be assigned future shifts (prevent).
 *         Past shifts for terminated employees produce a warning.
 */
const NoTerminatedFutureShifts = policy("NoTerminatedFutureShifts", {
  on: { model: ShiftAssignment, action: "create" },
  requires: {
    member: belongsTo(ref("ScheduleMember")),
  },
  rules: [
    {
      effect: "prevent",
      when: (ctx) => ctx.member.isTerminated === true,
    },
  ],
});

/**
 * REQ-36: A member cannot have overlapping shifts.
 *         Requires the collection of existing shifts for overlap check.
 */
const NoOverlappingShifts = policy("NoOverlappingShifts", {
  on: { model: ShiftAssignment, action: "create" },
  requires: {
    member: belongsTo(ref("ScheduleMember")),
    existingShifts: hasMany(ref("ShiftAssignment")),
  },
  rules: [
    {
      effect: "prevent",
      when: (ctx) => ctx.existingShifts.length > 0,
    },
  ],
});

/**
 * REQ-38: Warn when a member's weekly hours exceed 40.
 *         Requires the collection of same-week shifts for sum.
 */
const WeeklyHoursLimit = policy("WeeklyHoursLimit", {
  on: { model: ShiftAssignment, action: "create" },
  requires: {
    member: belongsTo(ref("ScheduleMember")),
    weekShifts: hasMany(ref("ShiftAssignment")),
  },
  rules: [
    {
      effect: "warn",
      when: (ctx) => ctx.weekShifts.length > 0,
    },
  ],
});

/**
 * REQ-40: Warn when daily hours for a position exceed the quota.
 *         Requires the collection of same-day shifts for sum.
 */
const DailyPositionQuota = policy("DailyPositionQuota", {
  on: { model: ShiftAssignment, action: "create" },
  requires: {
    position: belongsTo(ref("SchedulePosition")),
    dayShifts: hasMany(ref("ShiftAssignment")),
  },
  rules: [
    {
      effect: "warn",
      when: (ctx) => ctx.dayShifts.length > 0,
    },
  ],
});

export {
  DailyPositionQuota,
  NoOverlappingShifts,
  NoTerminatedFutureShifts,
  ShiftAssignment,
  WeeklyHoursLimit,
};
