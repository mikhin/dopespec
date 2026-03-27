import { describe, it, expect } from 'vitest';
import { validateMaxMaterializationCapOnEditAllFuture, validateMaxMaterializationCapOnUnpin, validateNoPastWeekModificationOnDeleteOccurrence, validateNoPastWeekModificationOnEditAllFuture, validateNoPastWeekModificationOnEditThisOnly, validateNoPastWeekModificationOnUnpin, validateNoTerminatedMemberPin } from './pinnedshift.policies.js';
import type { MaxMaterializationCapOnEditAllFutureContext, MaxMaterializationCapOnUnpinContext, NoPastWeekModificationOnDeleteOccurrenceContext, NoPastWeekModificationOnEditAllFutureContext, NoPastWeekModificationOnEditThisOnlyContext, NoPastWeekModificationOnUnpinContext, NoTerminatedMemberPinContext } from './pinnedshift.policies.js';

describe('MaxMaterializationCapOnEditAllFuture', () => {
  it('MaxMaterializationCapOnEditAllFuture:rule_0: ctx.materializedAssignments.length > 52 → prevent', () => {
    const ctx = {
      pinnedshift: {},
      materializedAssignments: [{}],
    };
    const result = validateMaxMaterializationCapOnEditAllFuture(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('MaxMaterializationCapOnEditAllFuture:rule_0');
  });
});

describe('MaxMaterializationCapOnUnpin', () => {
  it('MaxMaterializationCapOnUnpin:rule_0: ctx.materializedAssignments.length > 52 → prevent', () => {
    const ctx = {
      pinnedshift: {},
      materializedAssignments: [{}],
    };
    const result = validateMaxMaterializationCapOnUnpin(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('MaxMaterializationCapOnUnpin:rule_0');
  });
});

describe('NoPastWeekModificationOnDeleteOccurrence', () => {
  it('NoPastWeekModificationOnDeleteOccurrence:rule_0: ctx.member._isPastWeek === true → prevent', () => {
    const ctx = {
      pinnedshift: {},
      member: {},
    };
    const result = validateNoPastWeekModificationOnDeleteOccurrence(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoPastWeekModificationOnDeleteOccurrence:rule_0');
  });
});

describe('NoPastWeekModificationOnEditAllFuture', () => {
  it('NoPastWeekModificationOnEditAllFuture:rule_0: ctx.member._isPastWeek === true → prevent', () => {
    const ctx = {
      pinnedshift: {},
      member: {},
    };
    const result = validateNoPastWeekModificationOnEditAllFuture(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoPastWeekModificationOnEditAllFuture:rule_0');
  });
});

describe('NoPastWeekModificationOnEditThisOnly', () => {
  it('NoPastWeekModificationOnEditThisOnly:rule_0: ctx.member._isPastWeek === true → prevent', () => {
    const ctx = {
      pinnedshift: {},
      member: {},
    };
    const result = validateNoPastWeekModificationOnEditThisOnly(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoPastWeekModificationOnEditThisOnly:rule_0');
  });
});

describe('NoPastWeekModificationOnUnpin', () => {
  it('NoPastWeekModificationOnUnpin:rule_0: ctx.member._isPastWeek === true → prevent', () => {
    const ctx = {
      pinnedshift: {},
      member: {},
    };
    const result = validateNoPastWeekModificationOnUnpin(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoPastWeekModificationOnUnpin:rule_0');
  });
});

describe('NoTerminatedMemberPin', () => {
  it('NoTerminatedMemberPin:rule_0: ctx.member.isTerminated === true → prevent', () => {
    const ctx = {
      pinnedshift: {},
      member: {},
    };
    const result = validateNoTerminatedMemberPin(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('NoTerminatedMemberPin:rule_0');
  });
});
