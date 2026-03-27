import { describe, it, expect } from 'vitest';
import type { PinnedShiftProps } from './pinnedshift.types.js';
import { PinnedShiftEditAllFuture, PinnedShiftEditThisOnly, PinnedShiftDeleteOccurrence, PinnedShiftUnpin, PinnedShiftDelete } from './pinnedshift.transitions.js';

describe('PinnedShift', () => {
  it('given {"memberId":"m1","positionId":"p1","dayOfWeek":"monday"}, when editAllFuture, then status = active', () => {
    const ctx = { memberId: 'm1', positionId: 'p1', departmentId: '', shiftTypeId: '', dayOfWeek: 'monday', activeFrom: new Date(0), breakMinutes: 0, status: 'active', memberId: '', departmentId: '', positionId: '', shiftTypeId: '', materializedAssignmentsIds: [] } satisfies PinnedShiftProps;
    const result = PinnedShiftEditAllFuture(ctx);
    expect(result.status).toBe('active');
  });

  it('given {"memberId":"m1","positionId":"p1","dayOfWeek":"monday"}, when editThisOnly, then status = active', () => {
    const ctx = { memberId: 'm1', positionId: 'p1', departmentId: '', shiftTypeId: '', dayOfWeek: 'monday', activeFrom: new Date(0), breakMinutes: 0, status: 'active', memberId: '', departmentId: '', positionId: '', shiftTypeId: '', materializedAssignmentsIds: [] } satisfies PinnedShiftProps;
    const result = PinnedShiftEditThisOnly(ctx);
    expect(result.status).toBe('active');
  });

  it('given {"memberId":"m1","dayOfWeek":"tuesday"}, when deleteOccurrence, then status = active', () => {
    const ctx = { memberId: 'm1', positionId: '', departmentId: '', shiftTypeId: '', dayOfWeek: 'tuesday', activeFrom: new Date(0), breakMinutes: 0, status: 'active', memberId: '', departmentId: '', positionId: '', shiftTypeId: '', materializedAssignmentsIds: [] } satisfies PinnedShiftProps;
    const result = PinnedShiftDeleteOccurrence(ctx);
    expect(result.status).toBe('active');
  });

  it('given {"memberId":"m1","dayOfWeek":"monday"}, when unpin, then status = deleted', () => {
    const ctx = { memberId: 'm1', positionId: '', departmentId: '', shiftTypeId: '', dayOfWeek: 'monday', activeFrom: new Date(0), breakMinutes: 0, status: 'active', memberId: '', departmentId: '', positionId: '', shiftTypeId: '', materializedAssignmentsIds: [] } satisfies PinnedShiftProps;
    const result = PinnedShiftUnpin(ctx);
    expect(result.status).toBe('deleted');
  });

  it('given {"memberId":"m1","dayOfWeek":"monday"}, when delete, then status = deleted', () => {
    const ctx = { memberId: 'm1', positionId: '', departmentId: '', shiftTypeId: '', dayOfWeek: 'monday', activeFrom: new Date(0), breakMinutes: 0, status: 'active', memberId: '', departmentId: '', positionId: '', shiftTypeId: '', materializedAssignmentsIds: [] } satisfies PinnedShiftProps;
    const result = PinnedShiftDelete(ctx);
    expect(result.status).toBe('deleted');
  });

});
