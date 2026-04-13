export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type OrderProps = {
    createdAt: Date;
    status: OrderStatus;
    total: number;
    customerId: string;
    itemIds: string[];
};
//# sourceMappingURL=order.types.d.ts.map