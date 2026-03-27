import type { MemberProps } from './member.types.js';
import type { PinnedShiftProps } from './pinnedshift.types.js';
import type { ShiftAssignmentProps } from './shiftassignment.types.js';

export type MaxMaterializationCapOnEditAllFutureContext = {
  pinnedshift: PinnedShiftProps;
  materializedAssignments: ShiftAssignmentProps[];
};

export function validateMaxMaterializationCapOnEditAllFuture(ctx: MaxMaterializationCapOnEditAllFutureContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.materializedAssignments.length > 52) violations.push('MaxMaterializationCapOnEditAllFuture:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type MaxMaterializationCapOnUnpinContext = {
  pinnedshift: PinnedShiftProps;
  materializedAssignments: ShiftAssignmentProps[];
};

export function validateMaxMaterializationCapOnUnpin(ctx: MaxMaterializationCapOnUnpinContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.materializedAssignments.length > 52) violations.push('MaxMaterializationCapOnUnpin:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoPastWeekModificationOnDeleteOccurrenceContext = {
  pinnedshift: PinnedShiftProps;
  member: MemberProps;
};

export function validateNoPastWeekModificationOnDeleteOccurrence(ctx: NoPastWeekModificationOnDeleteOccurrenceContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member._isPastWeek === true) violations.push('NoPastWeekModificationOnDeleteOccurrence:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoPastWeekModificationOnEditAllFutureContext = {
  pinnedshift: PinnedShiftProps;
  member: MemberProps;
};

export function validateNoPastWeekModificationOnEditAllFuture(ctx: NoPastWeekModificationOnEditAllFutureContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member._isPastWeek === true) violations.push('NoPastWeekModificationOnEditAllFuture:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoPastWeekModificationOnEditThisOnlyContext = {
  pinnedshift: PinnedShiftProps;
  member: MemberProps;
};

export function validateNoPastWeekModificationOnEditThisOnly(ctx: NoPastWeekModificationOnEditThisOnlyContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member._isPastWeek === true) violations.push('NoPastWeekModificationOnEditThisOnly:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoPastWeekModificationOnUnpinContext = {
  pinnedshift: PinnedShiftProps;
  member: MemberProps;
};

export function validateNoPastWeekModificationOnUnpin(ctx: NoPastWeekModificationOnUnpinContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member._isPastWeek === true) violations.push('NoPastWeekModificationOnUnpin:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}

export type NoTerminatedMemberPinContext = {
  pinnedshift: PinnedShiftProps;
  member: MemberProps;
};

export function validateNoTerminatedMemberPin(ctx: NoTerminatedMemberPinContext): { valid: boolean; violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  if (ctx.member.isTerminated === true) violations.push('NoTerminatedMemberPin:rule_0');
  return { valid: violations.length === 0, violations, warnings };
}
