import {
  action,
  belongsTo,
  boolean,
  date,
  hasMany,
  lifecycle,
  model,
  number,
  optional,
  string,
} from "../schema/index.js";

// --- Customer ---

const customerStates = lifecycle.states("active", "suspended", "deleted");

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
    delete: from(customerStates.active).to(customerStates.deleted),
    reactivate: from(customerStates.suspended).to(customerStates.active),
    suspend: from(customerStates.active).to(customerStates.suspended),
  }),
});

// --- Pet ---

const petStates = lifecycle.states("available", "reserved", "sold");

const Pet = model("Pet", {
  actions: {
    updatePrice: action<{ price: number }>({ price: number() }),
    vaccinate: action<{ date: string }>({ date: string() }),
  },
  constraints: ({ rule }) => ({
    nicknameTooLong: rule()
      .when((ctx) => ctx.nickname !== undefined && ctx.nickname.length > 20)
      .prevent("vaccinate"),
  }),
  props: {
    name: string(),
    nickname: optional(string()),
    price: number(),
    species: string(),
    status: lifecycle(petStates),
    vaccinated: boolean(),
  },
  transitions: ({ from }) => ({
    release: from(petStates.reserved).to(petStates.available),
    reserve: from(petStates.available)
      .to(petStates.reserved)
      .when((ctx) => ctx.vaccinated === true)
      .scenario({ vaccinated: true }, petStates.reserved)
      .scenario({ vaccinated: false }, petStates.available),
    sell: from(petStates.reserved)
      .to(petStates.sold)
      .when((ctx) => ctx.price > 0)
      .scenario({ price: 50, vaccinated: true }, petStates.sold)
      .scenario({ price: 0, vaccinated: true }, petStates.reserved),
  }),
});

// --- Order ---

const orderStates = lifecycle.states(
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
);

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
      .when((ctx) => ctx.status === orderStates.cancelled)
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
    cancel: from(orderStates.pending).to(orderStates.cancelled),
    deliver: from(orderStates.shipped).to(orderStates.delivered),
    pay: from(orderStates.pending)
      .to(orderStates.paid)
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, orderStates.paid)
      .scenario({ total: 0 }, orderStates.pending),
    ship: from(orderStates.paid).to(orderStates.shipped),
  }),
});

export { Customer, Order, Pet };
