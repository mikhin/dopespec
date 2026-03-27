import type { PinnedShiftProps } from './pinnedshift.types.js';

export type PinnedShiftEditAllFutureEvent = {
  type: 'PinnedShiftEditAllFuture';
  payload: PinnedShiftProps;
  from: 'active';
  to: 'active';
  timestamp: Date;
};

export type PinnedShiftEditThisOnlyEvent = {
  type: 'PinnedShiftEditThisOnly';
  payload: PinnedShiftProps;
  from: 'active';
  to: 'active';
  timestamp: Date;
};

export type PinnedShiftDeleteOccurrenceEvent = {
  type: 'PinnedShiftDeleteOccurrence';
  payload: PinnedShiftProps;
  from: 'active';
  to: 'active';
  timestamp: Date;
};

export type PinnedShiftUnpinEvent = {
  type: 'PinnedShiftUnpin';
  payload: PinnedShiftProps;
  from: 'active';
  to: 'deleted';
  timestamp: Date;
};

export type PinnedShiftDeleteEvent = {
  type: 'PinnedShiftDelete';
  payload: PinnedShiftProps;
  from: 'active';
  to: 'deleted';
  timestamp: Date;
};

export type PinnedShiftEvent = PinnedShiftEditAllFutureEvent | PinnedShiftEditThisOnlyEvent | PinnedShiftDeleteOccurrenceEvent | PinnedShiftUnpinEvent | PinnedShiftDeleteEvent;
