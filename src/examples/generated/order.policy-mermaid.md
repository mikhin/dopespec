graph LR
NoSuspendedCustomerOrders -->|prevent/warn| Order.addItem
Customer -->|belongsTo| Order
