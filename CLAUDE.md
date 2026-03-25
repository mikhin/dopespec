# dopespec

Schema-first domain modeling tool. "Prisma for business logic."

Declarative TypeScript builder API → generates types, state machines, tests, diagrams.

## What This Is

A CLI tool (`npx dopespec generate`) that reads TypeScript schema definitions and generates:

- TypeScript discriminated unions from props/states
- Transition functions with runtime guards
- Service orchestrator skeletons per action
- Unit tests from scenarios
- E2E test stubs
- Zod validation from constraints
- Mermaid diagrams from transitions

## Example Schema

```typescript
const states = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const Order = model("Order", {
  props: {
    total: number(),
    status: lifecycle(states), // lifecycle() = state machine states
    priority: oneOf(["low", "high"] as const), // oneOf() = regular enum, not states
  },

  relations: {
    customer: belongsTo(Customer), // accepts model() output (branded ModelRef)
    items: hasMany(ref("OrderItem")), // ref() for forward references
  },

  actions: {
    addItem: action<{ productId: string; quantity: number }>(),
    removeItem: action<{ itemId: string }>(),
  },

  // Callbacks receive typed factories — ctx, states, and action keys are compile-time checked
  transitions: ({ from }) => ({
    pay: from(states[0])
      .to(states[1])
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, states[1])
      .scenario({ total: 0 }, states[0]),

    ship: from(states[1]).to(states[2]),
    cancel: from(states[0]).to(states[4]),
  }),

  constraints: ({ rule }) => ({
    cannotAddWhenCancelled: rule()
      .when((ctx) => ctx.status === states[4])
      .prevent("addItem"), // typed against action keys
  }),
});
```

## Architecture

```
src/
  schema/       — builder API (model, lifecycle, oneOf, action, ref, etc.)
  codegen/      — generators (types, transitions, tests, zod, mermaid)
  cli/          — CLI entry point
  examples/     — pet store example
```

Public exports: `model`, `lifecycle`, `oneOf`, `string`, `number`, `boolean`, `date`, `action`, `hasMany`, `belongsTo`, `ref`.
Internal (used via model() callbacks, not exported from index): `from`, `rule`, `createTypedFrom`, `createTypedRule`.

## Design Rules

- TypeScript strict mode
- Zero string literals after initial `as const` definition — all references typed
- `lifecycle()` defines state machine states; `oneOf()` is a regular enum with no relation to transitions
- `from()`/`rule()` are typed factories provided via model() callbacks — ctx, states, action keys checked at compile time
- Branded types: `ModelRef` (unique symbol) ensures `hasMany`/`belongsTo` only accept model outputs or `ref()` calls
- No classes — closures and functions
- No external runtime dependencies
- Vitest for testing
- Single file per model in schema — contains props, transitions, constraints, scenarios
- DDD: model()=Aggregate, props=Value Objects, transitions=Domain Events, constraints=Invariants, actions=Commands
- BDD: each transition scenario auto-generates a test case
- Compile-time + runtime + test strictness

## Bootstrap Goal

This tool will eventually describe its own models (Schema, Model, Prop, Transition, etc.) in its own schema format and generate itself.
