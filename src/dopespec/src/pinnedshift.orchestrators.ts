import type { PinnedShiftProps } from '../generated/pinnedshift.types.js';

export function handlePinnedShiftPin(ctx: PinnedShiftProps, _payload: { assignmentId: string }): PinnedShiftProps {
  // TODO: implement pin
  return ctx;
}

export function handlePinnedShiftUnpin(ctx: PinnedShiftProps, _payload: { date: string }): PinnedShiftProps {
  // TODO: implement unpin
  return ctx;
}

export function handlePinnedShiftEditAllFuture(ctx: PinnedShiftProps, _payload: { date: string; memberId: string; positionId: string; shiftTypeId: string; breakMinutes: number }): PinnedShiftProps {
  // TODO: implement editAllFuture
  return ctx;
}

export function handlePinnedShiftEditThisOnly(ctx: PinnedShiftProps, _payload: { date: string; memberId: string; positionId: string; shiftTypeId: string; breakMinutes: number }): PinnedShiftProps {
  // TODO: implement editThisOnly
  return ctx;
}

export function handlePinnedShiftDeleteOccurrence(ctx: PinnedShiftProps, _payload: { date: string }): PinnedShiftProps {
  // TODO: implement deleteOccurrence
  return ctx;
}
