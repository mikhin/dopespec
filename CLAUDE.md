# dopespec

Schema-first domain modeling tool. "Prisma for business logic."

Declarative TypeScript builder API → generates types, state machines, tests, diagrams.

## What This Is

A CLI tool (`npx dopespec generate`) that reads TypeScript schema definitions and generates:

- TypeScript discriminated unions from props/lifecycle states
- Transition functions with runtime guards
- Domain event types per transition (DDD)
- Command types per action (DDD)
- Invariant validation per constraint (DDD)
- Service orchestrator skeletons per action
- Unit tests in Given/When/Then style from scenarios (BDD)
- E2E test stubs
- Zod validation from constraints
- Mermaid diagrams from transitions

## Example Schema

```typescript
const states = lifecycle.states(
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
);

const Order = model("Order", {
  props: {
    total: number(),
    nickname: optional(string()), // optional() = key?: Type in generated output
    status: lifecycle(states), // lifecycle() = state machine states
    priority: oneOf(["low", "high"] as const), // oneOf() = regular enum, not states
  },

  relations: {
    customer: belongsTo(Customer), // accepts model() output (branded ModelRef)
    item: hasMany(ref("OrderItem")), // ref() for forward references (singular key)
  },

  actions: {
    addItem: action<{ productId: string; quantity: number }>({
      productId: string(),
      quantity: number(),
    }),
    removeItem: action<{ itemId: string }>({ itemId: string() }),
  },

  // Callbacks receive typed factories — ctx, states, and action keys are compile-time checked
  transitions: ({ from }) => ({
    pay: from(states.pending)
      .to(states.paid)
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, states.paid)
      .scenario({ total: 0 }, states.pending),

    ship: from(states.paid).to(states.shipped),
    cancel: from(states.pending).to(states.cancelled),
  }),

  constraints: ({ rule }) => ({
    cannotAddWhenCancelled: rule()
      .when((ctx) => ctx.status === states.cancelled)
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

Public exports: `model`, `lifecycle`, `oneOf`, `optional`, `string`, `number`, `boolean`, `date`, `action`, `hasMany`, `belongsTo`, `ref`.
Internal (used via model() callbacks, not exported from index): `from`, `rule`, `createTypedFrom`, `createTypedRule`.

## Design Rules

- TypeScript strict mode
- Zero string literals after initial definition — use `lifecycle.states()` for states, `as const` for other enums, everywhere else typed references
- `lifecycle()` defines state machine states; `oneOf()` is a regular enum with no relation to transitions
- `from()`/`rule()` are typed factories provided via model() callbacks — ctx, states, action keys checked at compile time
- Branded types: `ModelRef` (unique symbol) ensures `hasMany`/`belongsTo` only accept model outputs or `ref()` calls
- No classes — closures and functions
- No external runtime dependencies for generated code; CLI uses tsx for TypeScript schema loading
- Vitest for testing
- Single file per model in schema — contains props, transitions, constraints, scenarios
- DDD: model()=Aggregate, props=Value Objects, transitions=Domain Events, constraints=Invariants, actions=Commands
- BDD: each transition scenario auto-generates a test case
- Guards must use `ctx` as parameter name — codegen serializes guards via `Function.toString()` and relies on `ctx` references in generated code
- Compile-time + runtime + test strictness

## Generated Output Convention

Two-folder separation: `generated/` is always overwritten (safe to git-ignore), `src/` contains user code (never overwritten by CLI).

```
generated/                      ← always overwritten by CLI, git-ignored
  order.types.ts
  order.transitions.ts
  order.events.ts
  order.commands.ts
  order.invariants.ts
  order.tests.ts
  order.zod.ts
  order.mermaid.md
  credittier.evaluate.ts
  credittier.decision-tests.ts
  credittier.decision-table.md

src/                            ← user code, never touched by CLI
  order.orchestrators.ts        ← generated once if missing, user fills TODOs
  order.e2e-stubs.ts            ← generated once if missing, user fills TODOs
```

- `generated/` files import from each other via `./${modelName}.*.js`
- `src/` user code imports from `../generated/` for types
- CLI warns when new actions/transitions added but user file exists: "file exists, new handler not added"

## `decisions()` — Decision Tables

Decision table. Inputs → outputs. No lifecycle, no state machine. Pure function.

```typescript
const CreditTier = decisions("CreditTier", {
  inputs: { extraItemId: string(), amount: number() },
  outputs: { credits: number() },
  rules: [
    { when: { extraItemId: "tier_3" }, then: { credits: 5 } },
    { when: { extraItemId: "tier_5" }, then: { credits: 10 } },
    { when: { extraItemId: "tier_12" }, then: { credits: 30 } },
  ],
});
```

Inputs can reference model props via shared const for type safety:

```typescript
const petProps = {
  species: oneOf(["dog", "cat", "bird", "fish"] as const),
  vaccinated: boolean(),
} as const;

const Pet = model("Pet", { props: petProps, ... });

const PetAdoptionFee = decisions("PetAdoptionFee", {
  inputs: { species: petProps.species, vaccinated: petProps.vaccinated },
  outputs: { fee: number() },
  rules: [
    { when: { species: "dog", vaccinated: true }, then: { fee: 50 } },
    { when: { species: "typo" }, ... },  // compile error — "typo" not in oneOf
  ],
});
```

Generates: evaluate function, unit tests (one per rule), markdown table.

See `docs/three-primitives.md` for full architecture decision (model + decisions + future cross-model).

## `policy()` — Cross-Model Rules (designed, not built)

Cross-model validation. Checks related entities before allowing an action.

```typescript
const NoTerminatedAssignments = policy("NoTerminatedAssignments", {
  on: { model: ShiftAssignment, action: "create" },
  requires: {
    member: belongsTo(Member),           // single entity
    existingShifts: hasMany(ShiftAssignment), // collection
  },
  rules: [
    { when: (ctx) => ctx.member.isTerminated === true, effect: "prevent" },
    { when: (ctx) => sumHours(ctx.existingShifts) > 40, effect: "warn" },
  ],
});
```

**Design decisions (voted by independent reviewers):**
- Array style rules (like decisions, not callback like model)
- Both `prevent` (blocks action) and `warn` (logs, doesn't block)
- Collections supported in requires (hasMany for aggregation rules)
- `on: { model, action }` required — binds policy to specific model+action
- Per-model files: `shiftassignment.policies.ts`
- Generated policyIndex listing all policies per model+action
- Auto-include policy validation in generated orchestrators (as TODO)

Generates: policy validator, integration tests, policyIndex, Mermaid interaction diagram.

## Bootstrap Goal

This tool will eventually describe its own models (Schema, Model, Prop, Transition, etc.) in its own schema format and generate itself.
