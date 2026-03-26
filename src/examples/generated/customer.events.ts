import type { CustomerProps } from './customer.types.js';

export type CustomerDeleteEvent = {
  type: 'CustomerDelete';
  payload: CustomerProps;
  from: 'active';
  to: 'deleted';
  timestamp: Date;
};

export type CustomerReactivateEvent = {
  type: 'CustomerReactivate';
  payload: CustomerProps;
  from: 'suspended';
  to: 'active';
  timestamp: Date;
};

export type CustomerSuspendEvent = {
  type: 'CustomerSuspend';
  payload: CustomerProps;
  from: 'active';
  to: 'suspended';
  timestamp: Date;
};

export type CustomerEvent = CustomerDeleteEvent | CustomerReactivateEvent | CustomerSuspendEvent;
