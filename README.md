# dopespec

[![CI](https://github.com/mikhin/dopespec/actions/workflows/ci.yml/badge.svg)](https://github.com/mikhin/dopespec/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dopespec)](https://www.npmjs.com/package/dopespec)

Schema-first domain modeling. Describe your business logic in TypeScript, generate everything else.

One schema file produces: types, state machines, validators, tests, Zod schemas, Mermaid diagrams.

## Three Primitives

### `model()` — entity with lifecycle

```typescript
const states = lifecycle.states("pending", "paid", "shipped", "cancelled");

const Order = model("Order", {
  props: {
    total: number(),
    status: lifecycle(states),
  },
  transitions: ({ from }) => ({
    pay: from(states.pending)
      .to(states.paid)
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, states.paid)
      .scenario({ total: 0 }, states.pending),
    ship: from(states.paid).to(states.shipped),
    cancel: from(states.pending).to(states.cancelled),
  }),
});
```

Generates: TypeScript types, transition functions with guards, domain events, command types, invariant validators, orchestrator skeletons, unit tests (BDD), e2e stubs, Zod schema, Mermaid state diagram.

Prop types: `string()`, `number()`, `boolean()`, `date()`, `oneOf([...])`, `arrayOf(prop)` (e.g. `arrayOf(date())` → `Date[]`), `optional(prop)`, and `lifecycle(states)`.

Relations: `belongsTo(M)` / `hasMany(M)` generate normalized id refs (`xId` / `xIds`); `embeds(M)` nests the child's props inline as an array (`key: ChildProps[]`) for denormalized aggregates / tree structures.

Action payloads: a literal string-union field accepts a matching `oneOf([...])` so the union survives into the generated command type instead of widening to `string` — `action<{ direction: "left" | "right" }>({ direction: oneOf(["left", "right"]) })` generates `payload: { direction: 'left' | 'right' }`. `string()` stays valid for such fields too.

### `decisions()` — pure decision table

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

Generates: evaluate function, unit tests (one per rule), markdown table.

Inputs can reference model props for shared type safety:

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
    { when: { species: "typo" }, ... },  // compile error
  ],
});
```

### `policy()` — cross-model rules

```typescript
const NoSuspendedCustomerOrders = policy("NoSuspendedCustomerOrders", {
  on: { model: Order, action: "addItem" },
  requires: { customer: belongsTo(Customer) },
  rules: [
    { when: (ctx) => ctx.customer.status === "suspended", effect: "prevent" },
    { when: (ctx) => ctx.customer.status === "deleted", effect: "warn" },
  ],
});
```

Generates: policy validator, integration tests, policy index, Mermaid interaction diagram.

## Quick Start

```bash
pnpm add -D dopespec
```

Create a schema file (`schema/order.ts`):

```typescript
import { lifecycle, model, number } from "dopespec";

const states = lifecycle.states("draft", "published");

export const Order = model("Order", {
  props: {
    total: number(),
    status: lifecycle(states),
  },
  transitions: ({ from }) => ({
    publish: from(states.draft)
      .to(states.published)
      .when((ctx) => ctx.total > 0)
      .scenario({ total: 100 }, states.published)
      .scenario({ total: 0 }, states.draft),
  }),
});
```

Generate:

```bash
npx dopespec generate schema/order.ts
```

Output:

```
generated/
  order.types.ts          types + props interface
  order.transitions.ts    transition functions with guards
  order.events.ts         domain event types
  order.commands.ts       command types
  order.invariants.ts     constraint validators
  order.test.ts           unit tests (BDD)
  order.zod.ts            Zod validation schema
  order.mermaid.md        state diagram

src/
  order.orchestrators.ts  handler skeletons (generated once, you fill TODOs)
  order.e2e.ts            e2e test stubs (generated once)
```

`generated/` is always overwritten. `src/` is never overwritten — your code stays safe.

## Feature map

`dopespec map` rolls every construct into a single Mermaid tree — a bird's-eye view that complements the per-construct diagrams from `generate`. Useful for onboarding and for non-technical readers (PM / design).

```bash
dopespec map schema/                          # scan a folder
dopespec map schema/order.ts                  # …or a single file
dopespec map schema/ --out docs/feature-map.md
```

Constructs are grouped by **area**. Set it explicitly on any construct:

```typescript
const Order = model("Order", {
  area: "Sales",
  props: {
    /* … */
  },
});
```

If `area` is omitted, `map` falls back to the construct's top-level folder under the scanned path (so `schema/sales/order.ts` → `sales`).

## Where It Shines

- **`decisions()`** for permission tables — strongest use case, direct replacement for hand-written if/else
- **`model()`** on backend — types, transitions, validators, tests from one schema. On frontend — useful for documentation and local state
- **`policy()`** for cross-model constraints — typed context, wiring, policy index. For complex computation use helper functions in user code

## What It Does NOT Cover

- Async workflows / sagas (multi-step processes with side effects)
- Database queries in guards (guards are pure functions of props)
- Side effects (send email, call API — belongs in orchestrators)
- Time-based constraints (`new Date()` in guards is non-deterministic)
- UI rendering (dopespec generates logic, not components)
- Complex computation inside guards — extract to helper functions instead

## DDD Mapping

| DDD Concept    | dopespec                   |
| -------------- | -------------------------- |
| Aggregate      | `model()`                  |
| Value Object   | `model.props`              |
| Command        | `model.actions`            |
| Domain Event   | generated from transitions |
| Invariant      | `model.constraints`        |
| Specification  | `decisions()`              |
| Domain Service | `policy()`                 |

## BDD

Every `.scenario()` in a model and every rule in `decisions()`/`policy()` auto-generates a Given/When/Then test.

```typescript
// In schema:
pay: from(states.pending)
  .to(states.paid)
  .when((ctx) => ctx.total > 0)
  .scenario({ total: 100 }, states.paid);

// Generated test:
it('given {"total":100}, when pay, then status = paid', () => {
  const ctx = { total: 100, status: "pending" };
  const result = OrderPay(ctx);
  expect(result.status).toBe("paid");
});
```

## Roadmap

- [x] Array prop type (`dates: arrayOf(date())`) — needed for real-world models like excluded dates, tag lists
- [x] Embedded model collections (`embeds(M)` → nested `ChildProps[]`) — denormalized aggregates / trees
- [x] npm publish
- [ ] Self-hosting (dopespec describes its own types in its own schema)
- [ ] ESLint plugin (static analysis: unreachable states, dead actions, missing scenarios)
- [x] Non-tech participation (diagrams + markdown tables readable by PM/designers) — see `dopespec map`
- [ ] Visual editor (Cloud, paid)

## Influenced By

Prisma, XState, Cucumber/Gherkin, Decision Tables (BRMS), Nick Tune DSL, OpenAPI, Specification by Example, Clean Architecture.
