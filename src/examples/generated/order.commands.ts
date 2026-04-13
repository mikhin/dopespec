export type OrderAddItemCommand = {
  type: 'OrderAddItem';
  payload: { productId: string; quantity: number };
};

export type OrderRemoveItemCommand = {
  type: 'OrderRemoveItem';
  payload: { itemId: string };
};

export type OrderCommand = OrderAddItemCommand | OrderRemoveItemCommand;
