export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderProps = {
  createdAt: Date;
  status: OrderStatus;
  total: number;
  customerId: string; // belongsTo Customer
  itemIds: string[]; // hasMany Pet
};
