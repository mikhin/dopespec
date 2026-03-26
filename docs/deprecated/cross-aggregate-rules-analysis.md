# Cross-Aggregate Business Rules in dopespec

## Problem

dopespec cannot express business rules that span multiple aggregates.
Example: "Order cannot be paid if Customer is suspended."

This contradicts the core purpose ("Prisma for business logic") — if cross-aggregate rules are not in the schema, they're lost to codegen.

---

## Current State

- `ctx` contains only the model's own props (`InferContext<Props>`)
- Relations generate foreign key fields (`customerId: string`, `itemIds: string[]`)
- Guards: `(ctx) => ctx.total > 0` — single-expression arrows, single model
- Constraints: `.when(guard).prevent(actionKey)` — within aggregate only
- Codegen: each generator is `(model: ModelDef) => string` — single model in, string out
- `guardToSource()` is string-based (Function.toString → regex) — accidentally approach-agnostic

---

## Three Approaches Analyzed

### Approach 1: Extend ctx with relations

```typescript
.when((ctx) => ctx.total > 0 && ctx.customer.status === "active")
```

**Verdict: REJECTED — showstoppers found.**

- Circular model references (Order → Customer → Order) create infinite type recursion in `InferContext`
- `return { ...ctx, status: 'paid' }` in transitions spreads nested relation data into return — semantically wrong
- `Props` type conflates storage shape (IDs) with runtime shape (nested objects)
- Pollutes ALL transitions/scenarios with relation types, even when irrelevant
- Every generator needs model registry access — architectural rewrite
- Violates DDD aggregate boundaries silently — teaches bad patterns

### Approach 2: Standalone policy

```typescript
policy("CustomerMustBeActive", {
  models: [Order, Customer],
  when: (order, customer) => customer.status === "suspended",
  prevents: "pay",
});
```

**Verdict: Cleanest DDD separation, lowest impact on existing code.**

Pros:

- Zero changes to existing generators
- Explicit cross-aggregate concept — honest about what it is
- Maps to DDD Domain Service / Policy pattern
- Generates to service/orchestrator layer, not inside aggregates
- Can generate its own test file, diagram, types

Cons:

- New top-level concept (schema primitive alongside `model()`)
- New generator, new file convention (`order-customer.policy.js`?)
- Disconnected from model definition — less "schema-first" feeling
- `prevents: "pay"` is ambiguous if multiple models have same action key
- Multi-param guard `(order, customer) =>` breaks current `guardToSource()` regex (fixable)
- Nested relations: `models: [Order, Customer, Address]` — fragile param ordering

### Approach 3: Constraint with requires()

```typescript
constraints: ({ rule }) => ({
  customerMustBeActive: rule()
    .requires("customer")
    .when((ctx) => ctx.customer.status === "suspended")
    .prevent("pay"),
});
```

**Verdict: Most ergonomic, medium implementation cost.**

Pros:

- Lives inside model definition — natural extension of existing API
- `.requires()` explicitly declares cross-aggregate dependency
- Consistent chaining pattern with existing `.when().prevent()`
- Auditable — linter/codegen can flag all `requires()` constraints
- `guardToSource()` works as-is (still `(ctx) => expr`)

Cons:

- `ModelRef` is a phantom brand — carries no target prop types. Needs redesign or parallel type-resolution
- `ConstraintBuilder` needs new `Relations` generic parameter threaded through
- Combined `validateOrder()` gets non-uniform signature (some constraints need enriched ctx)
- Nested relations (`ctx.customer.address.city`) needs dot-path or chained `.requires()`
- Still requires model registry for codegen to resolve relation target types
- Technically violates DDD aggregate boundaries (rule lives in Order but knows about Customer)

---

## Architectural Constraint: Single-Model Generator

All current generators have signature `(model: ModelDef) => string`. Cross-aggregate features require either:

1. **Model registry** passed to generators — `(model: ModelDef, registry: Map<string, ModelDef>) => string`
2. **New generator type** for cross-aggregate concepts — `(policy: PolicyDef) => string`
3. **Pre-resolution** — resolve relation targets during schema building, embed target props into ModelDef

Option 1 changes every generator signature. Option 2 is isolated but duplicates logic. Option 3 front-loads the work.

---

## DDD Perspective

| Pattern                 | Consistency | Where rules live     | dopespec mapping       |
| ----------------------- | ----------- | -------------------- | ---------------------- |
| Domain Service          | Immediate   | Application layer    | Generated orchestrator |
| Saga / Process Manager  | Eventual    | Orchestration layer  | Future extension       |
| Policy (event-reactive) | Eventual    | Listener layer       | Generated handler      |
| Specification           | Either      | Standalone predicate | Generated validator    |

Cross-aggregate rules in DDD are **not** part of any aggregate. They belong to Domain Services or Policies. This favors Approach 2. However, for a "schema-first" tool, having rules live outside model definitions feels like they're second-class citizens.

---

## Existing Tools Comparison

- **Prisma**: Punts cross-model logic to application code entirely. No declarative rules.
- **Rails ActiveRecord**: Allows `validate :check_customer` that reaches into associations. Works but creates hidden coupling.
- **Hasura**: Permission rules can reference related tables via JSON predicates — closest to declarative cross-aggregate rules, but limited to authorization.
- **Django**: Model validators can reference related objects. Same coupling issue as Rails.

None of these tools solve it declaratively at the schema level. This is an opportunity for dopespec.

---

## Recommendation

**Hybrid of Approach 2 + 3:**

- `policy()` as a peer of `model()` — separate concept, honest about cross-aggregate nature
- But with `.requires()` syntax for explicit dependency declaration
- Generates to orchestrator/service layer (not inside aggregate code)
- Generates its own tests, types, and diagrams
- Uses existing `guardToSource()` with `ctx` param (composite ctx shape)

```typescript
const OrderPayment = policy("OrderPayment", {
  on: { model: Order, action: "pay" },
  requires: { customer: belongsTo(Customer) },
  rules: ({ rule }) => ({
    customerMustBeActive: rule()
      .when((ctx) => ctx.customer.status === "suspended")
      .prevent(),
  }),
  scenarios: ({ given }) => ({
    activeCustomer: given({
      order: { total: 100, status: "pending" },
      customer: { status: "active" },
    }).expect("allowed"),
    suspendedCustomer: given({
      order: { total: 100, status: "pending" },
      customer: { status: "suspended" },
    }).expect("prevented"),
  }),
});
```

This generates:

- `order.payment.policy.ts` — validator function
- `order.payment.policy.tests.ts` — test cases from scenarios
- `order.payment.policy.mermaid.md` — interaction diagram

---

## Open Questions

1. Should policy scenarios generate unit tests (mocked relations) or integration tests (real fixtures)?
2. How does the developer provide the related model data at runtime? Repository injection? Convention-based loading?
3. Should policies support reactions (event → command) in addition to prevention rules?
4. How do policies interact with the bootstrap goal (dopespec describing itself)?
5. Naming: `policy()` vs `rule()` vs `interaction()` vs `coordination()`?
