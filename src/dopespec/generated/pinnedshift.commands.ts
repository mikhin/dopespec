export type PinnedShiftPinCommand = {
  type: 'PinnedShiftPin';
  payload: { assignmentId: string };
};

export type PinnedShiftUnpinCommand = {
  type: 'PinnedShiftUnpin';
  payload: { date: string };
};

export type PinnedShiftEditAllFutureCommand = {
  type: 'PinnedShiftEditAllFuture';
  payload: { date: string; memberId: string; positionId: string; shiftTypeId: string; breakMinutes: number };
};

export type PinnedShiftEditThisOnlyCommand = {
  type: 'PinnedShiftEditThisOnly';
  payload: { date: string; memberId: string; positionId: string; shiftTypeId: string; breakMinutes: number };
};

export type PinnedShiftDeleteOccurrenceCommand = {
  type: 'PinnedShiftDeleteOccurrence';
  payload: { date: string };
};

export type PinnedShiftCommand = PinnedShiftPinCommand | PinnedShiftUnpinCommand | PinnedShiftEditAllFutureCommand | PinnedShiftEditThisOnlyCommand | PinnedShiftDeleteOccurrenceCommand;
