import type { PetProps } from './pet.types.js';

export type PetReleaseEvent = {
  type: 'PetRelease';
  payload: PetProps;
  from: 'reserved';
  to: 'available';
  timestamp: Date;
};

export type PetReserveEvent = {
  type: 'PetReserve';
  payload: PetProps;
  from: 'available';
  to: 'reserved';
  timestamp: Date;
};

export type PetSellEvent = {
  type: 'PetSell';
  payload: PetProps;
  from: 'reserved';
  to: 'sold';
  timestamp: Date;
};

export type PetEvent = PetReleaseEvent | PetReserveEvent | PetSellEvent;
