# dopespec

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
  order.tests.ts          unit tests (BDD)
  order.zod.ts            Zod validation schema
  order.mermaid.md        state diagram

src/
  order.orchestrators.ts  handler skeletons (generated once, you fill TODOs)
  order.e2e.ts            e2e test stubs (generated once)
```

`generated/` is always overwritten. `src/` is never overwritten — your code stays safe.

## Real-World Usage

Validated on a production scheduling SaaS:

- **Navigation permissions** — 33 lines of if/else replaced by 4-rule `decisions()` table
- **Member edit permissions** — 139 lines of nested conditions replaced by 8-rule `decisions()` table with scope levels
- **Invite lifecycle** — `model()` with 4 states, 6 transitions, 4 constraints, generated tests + Mermaid diagram
- **Schedule validation** — 4 `policy()` rules: terminated employee check, overlapping shifts, weekly hours limit, daily position quota
- **Invite authorization** — `policy()`: only org admin can resend/revoke invites
- **Invite UI visibility** — `decisions()` table: status x permissions -> button visibility

## Where It Shines

- **`decisions()`** for permission tables — strongest use case, direct replacement for hand-written if/else
- **`model()`** on backend — types, transitions, validators, tests from one schema. On frontend — useful for documentation (Mermaid) and local state (Kanban, form wizards)
- **`policy()`** for cross-model constraints — typed context, wiring, policy index. For complex computation (overlap detection, hours aggregation), use helper functions in user code

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

- [ ] Array prop type (`dates: arrayOf(date())`) — needed for real-world models like excluded dates, tag lists
- [ ] npm publish
- [ ] Self-hosting (dopespec describes its own types in its own schema)
- [ ] ESLint plugin (static analysis: unreachable states, dead actions, missing scenarios)
- [ ] Non-tech participation (diagrams + markdown tables readable by PM/designers)
- [ ] Visual editor (Cloud, paid)

## Influenced By

Prisma, XState, Cucumber/Gherkin, Decision Tables (BRMS), Nick Tune DSL, OpenAPI, Specification by Example, Clean Architecture.
