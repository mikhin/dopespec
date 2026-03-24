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
const states = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const

const Order = model('Order', {
  props: {
    total: number(),
    status: oneOf(states),
  },

  relations: {
    customer: belongsTo(Customer),
    items: hasMany(OrderItem),
  },

  transitions: {
    pay: from(states.pending).to(states.paid)
      .when(ctx => ctx.total > 0)
      .scenario({ total: 100 }, states.paid)
      .scenario({ total: 0 }, states.pending),

    ship: from(states.paid).to(states.shipped),

    cancel: from(states.pending).to(states.cancelled),
  },

  constraints: {
    cannotShipCancelled: rule()
      .when(ctx => ctx.status === states.cancelled)
      .prevent(actions.ship),
  },

  actions: {
    addItem: action<{ productId: string, quantity: number }>(),
    removeItem: action<{ itemId: string }>(),
  },
})
```

## Architecture

```
src/
  schema/       — builder API (model, props, from, oneOf, rule, action, etc.)
  codegen/      — generators (types, transitions, tests, zod, mermaid)
  cli/          — CLI entry point
  examples/     — pet store example
```

## Design Rules

- TypeScript strict mode
- Zero string literals after initial `as const` definition — all references typed
- No classes — closures and functions
- No external runtime dependencies
- Vitest for testing
- Single file per model in schema — contains props, transitions, constraints, scenarios
- DDD: model()=Aggregate, props=Value Objects, transitions=Domain Events, constraints=Invariants, actions=Commands
- BDD: each transition scenario auto-generates a test case
- Compile-time + runtime + test strictness

## Bootstrap Goal

This tool will eventually describe its own models (Schema, Model, Prop, Transition, etc.) in its own schema format and generate itself.
