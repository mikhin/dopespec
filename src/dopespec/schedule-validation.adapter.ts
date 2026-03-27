/**
 * Adapter: maps dopespec policy violations → Duler ValidationIssue type.
 *
 * The generated policy validators return { valid, violations, warnings }
 * with stable IDs like "NoTerminatedFutureShifts:rule_0".
 *
 * This adapter converts those into the ValidationIssue shape expected by
 * the existing Duler schedule UI (code, severity, message, metadata).
 */

// -- Duler types (duplicated here for reference; in production import from @/types/schedule) --

type ValidationSeverity = "error" | "warning";

type ValidationIssue = {
  assignmentId?: string;
  code: string;
  message: string;
  metadata: {
    conflictingAssignmentId?: string;
    hoursOverGuide?: number;
    memberId: string;
    memberName: string;
    positionName: string;
    weeklyHours?: number;
  };
  severity: ValidationSeverity;
};

// -- Violation ID → Duler code mapping --

const VIOLATION_CODE_MAP: Record<string, string> = {
  "NoTerminatedFutureShifts:rule_0": "TERMINATED_EMPLOYEE",
  "NoOverlappingShifts:rule_0": "OVERLAPPING_SHIFTS",
  "WeeklyHoursLimit:rule_0": "WEEKLY_HOURS_EXCEEDED",
  "DailyPositionQuota:rule_0": "DAILY_LABOR_GUIDE_EXCEEDED",
} as const;

const DEFAULT_MESSAGES: Record<string, string> = {
  "NoTerminatedFutureShifts:rule_0": "Employee is terminated",
  "NoOverlappingShifts:rule_0": "Overlaps with existing shift",
  "WeeklyHoursLimit:rule_0": "Weekly hours exceed 40",
  "DailyPositionQuota:rule_0": "Daily labor guide exceeded",
} as const;

// -- Adapter --

type MemberInfo = {
  id: string;
  firstName: string;
  lastName: string;
};

type PositionInfo = {
  name: string;
};

type AdapterContext = {
  assignmentId?: string;
  member: MemberInfo;
  position?: PositionInfo;
};

/**
 * Convert a dopespec policy result into Duler ValidationIssues.
 *
 * @param result - output from any validateXxx() function
 * @param ctx    - member/position info for metadata
 */
export function toValidationIssues(
  result: { violations: string[]; warnings: string[] },
  ctx: AdapterContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const memberName = `${ctx.member.firstName} ${ctx.member.lastName}`;

  for (const violationId of result.violations) {
    issues.push({
      assignmentId: ctx.assignmentId,
      code: VIOLATION_CODE_MAP[violationId] ?? violationId,
      message: DEFAULT_MESSAGES[violationId] ?? violationId,
      metadata: {
        memberId: ctx.member.id,
        memberName,
        positionName: ctx.position?.name ?? "",
      },
      severity: "error",
    });
  }

  for (const warningId of result.warnings) {
    issues.push({
      assignmentId: ctx.assignmentId,
      code: VIOLATION_CODE_MAP[warningId] ?? warningId,
      message: DEFAULT_MESSAGES[warningId] ?? warningId,
      metadata: {
        memberId: ctx.member.id,
        memberName,
        positionName: ctx.position?.name ?? "",
      },
      severity: "warning",
    });
  }

  return issues;
}
