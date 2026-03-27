import type { OrderProps } from "./order.types.js";

export type OrderCancelEvent = {
  type: "OrderCancel";
  payload: OrderProps;
  from: "pending";
  to: "cancelled";
  timestamp: Date;
};

export type OrderDeliverEvent = {
  type: "OrderDeliver";
  payload: OrderProps;
  from: "shipped";
  to: "delivered";
  timestamp: Date;
};

export type OrderPayEvent = {
  type: "OrderPay";
  payload: OrderProps;
  from: "pending";
  to: "paid";
  timestamp: Date;
};

export type OrderShipEvent = {
  type: "OrderShip";
  payload: OrderProps;
  from: "paid";
  to: "shipped";
  timestamp: Date;
};

export type OrderEvent =
  | OrderCancelEvent
  | OrderDeliverEvent
  | OrderPayEvent
  | OrderShipEvent;
