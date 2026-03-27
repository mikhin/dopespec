import type { PinnedShiftProps } from './pinnedshift.types.js';

export function PinnedShiftEditAllFuture(ctx: PinnedShiftProps): PinnedShiftProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot editAllFuture: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'active' };
}

export function PinnedShiftEditThisOnly(ctx: PinnedShiftProps): PinnedShiftProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot editThisOnly: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'active' };
}

export function PinnedShiftDeleteOccurrence(ctx: PinnedShiftProps): PinnedShiftProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot deleteOccurrence: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'active' };
}

export function PinnedShiftUnpin(ctx: PinnedShiftProps): PinnedShiftProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot unpin: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'deleted' };
}

export function PinnedShiftDelete(ctx: PinnedShiftProps): PinnedShiftProps {
  if (ctx.status !== 'active') {
    throw new Error(`Cannot delete: expected status 'active', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'deleted' };
}
