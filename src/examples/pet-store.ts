import {
  action,
  belongsTo,
  boolean,
  date,
  hasMany,
  lifecycle,
  model,
  number,
  string,
} from "../schema/index.js";

// --- Customer ---

const customerStates = ["active", "suspended", "deleted"] as const;

const Customer = model("Customer", {
  actions: {
    updateEmail: action<{ email: string }>({ email: string() }),
  },
  props: {
    email: string(),
    name: string(),
    status: lifecycle(customerStates),
  },
  transitions: ({ from }) => ({
    delete: from(customerStates[0]).to(customerStates[2]),
    reactivate: from(customerStates[1]).to(customerStates[0]),
    suspend: from(customerStates[0]).to(customerStates[1]),
  }),
});

// --- Pet ---

const petStates = ["available", "reserved", "sold"] as const;

const Pet = model("Pet", {
  actions: {
    updatePrice: action<{ price: number }>({ price: number() }),
    vaccinate: action<{ date: string }>({ date: string() }),
  },
  props: {
    name: string(),
    price: number(),
    species: string(),
    status: lifecycle(petStates),
    vaccinated: boolean(),
  },
  transitions: ({ from }) => ({
    release: from(petStates[1]).to(petStates[0]),
    reserve: from(petStates[0])
      .to(petStates[1])
      .when((ctx) => ctx.vaccinated === true),
    sell: from(petStates[1])
      .to(petStates[2])
      .when((ctx) => ctx.price > 0)
      .scenario({ price: 50, vaccinated: true }, petStates[2])
      .scenario({ price: 0, vaccinated: true }, petStates[1]),
  }),
});

// --- Order ---

const orderStates = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const Order = model("Order", {
  actions: {
    addItem: action<{ productId: string; quantity: number }>({
      productId: string(),
      quantity: number(),
    }),
    removeItem: action<{ itemId: string }>({ itemId: string() }),
  },
  constraints: ({ rule }) => ({
    cannotAddWhenCancelled: rule()
      .when((ctx) => ctx.status === orderStates[4])
      .prevent("addItem"),
    cannotRemoveWhenEmpty: rule()
      .when((ctx) => ctx.total === 0)
      .prevent("removeItem"),
  }),
  props: {
    createdAt: date(),
    status: lifecycle(orderStates),
    total: number(),
  },
  relations: {
    customer: belongsTo(Customer),
    item: hasMany(Pet),
  },
  transitions: ({ from }) => ({
    cancel: from(orderStates[0]).to(orderStates[4]),
    deliver: from(orderStates[2]).to(orderStates[3]),
    pay: from(orderStates[0])
      .to(orderStates[1])
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, orderStates[1])
      .scenario({ total: 0 }, orderStates[0]),
    ship: from(orderStates[1]).to(orderStates[2]),
  }),
});

export { Customer, Order, Pet };
