# dopespec — Architecture Decision: Primitives

## Decision

dopespec will have up to three primitives. Only `model()` exists today. Others are planned, not built.

## `model()` — one entity and its lifecycle ✅ BUILT

```
props, lifecycle, transitions, constraints, actions, relations, scenarios
```

**Generates:** types, transitions, events, commands, invariants, orchestrators, unit tests, zod, mermaid

**DDD:** Aggregate, Value Objects, Commands, Events, Invariants

## `decisions()` — pure function: inputs → outputs ✅ BUILT

```
inputs, outputs, rules (when → then)
```

**Generates:** evaluate function, unit tests, markdown table

**DDD:** Specification

**Use cases:** permissions, access control, UI visibility matrices

**Key design:** decisions() inputs can reference model props directly via shared const (e.g. `petProps.species`). This ensures type-level link — changing model props forces decision table review at compile time.

## `policy()` — rule between entities ✅ BUILT

```
on (model + action), requires (belongsTo/hasMany), rules [{ when, effect }]
```

**Generates:** policy validator per model, integration tests, policyIndex, Mermaid interaction diagram

**DDD:** Domain Service / Policy

**Use cases:** cross-aggregate constraints, WIP limits, role restrictions

**API design decided (independent reviewer vote):**

- Array style rules `[{ when, effect }]` (like decisions, not callback)
- Both `prevent` and `warn` effects
- Collections in requires via `hasMany()` (for aggregation rules)
- `on: { model, action }` required
- Per-model output files: `shiftassignment.policies.ts`
- policyIndex generated listing all policies per model+action
- Auto-include validation in orchestrators as TODO

**`.requires()` in model.constraints rejected** — breaks type system (InferContext, guardToSource, resolveGuardBody). See CLAUDE.md for full API example.

## Why these three

All three share the same internal structure:

```
shape    — what exists (props, relations, inputs/outputs)
rule     — when(condition) → effect
scenario — given → when → then
```

| Primitive     | Shape            | Rules                                             | Scenarios                |
| ------------- | ---------------- | ------------------------------------------------- | ------------------------ |
| `model()`     | props, relations | transitions (state change), constraints (prevent) | per transition           |
| `decisions()` | inputs, outputs  | when → then (output mapping)                      | implicit (1 per rule)    |
| `policy()`    | on + requires    | when → prevent (optional)                         | cross-model given/expect |

## Alternatives considered

- **`interaction()` as a fourth primitive** — deferred. Could be `policy()` without rules, or could remain separate. See `docs/deprecated/new-primitives.md` for original design.
- **`policy()` as a standalone primitive** — one option for cross-model rules. Simpler to implement than extending model().
- **Extending `model.constraints` with `.requires()`** — alternative to policy(). All rules in one place, but harder type work (InferContext redesign).
- **One generic primitive** — rejected. TypeScript generics can't discriminate well enough. API becomes unreadable with 50% dead fields.
- **Two primitives only (model + decisions)** — still possible if cross-model rules aren't needed or can be handled by extended constraints.

Cross-model design (policy vs interaction vs extended constraints) is **not decided**. Will be resolved when a real use case demands it.

See `docs/deprecated/cross-aggregate-rules-analysis.md` for detailed analysis of cross-model approaches.

## What dopespec does NOT cover

These are explicitly out of scope — not bugs, not future features:

- **Time-based constraints** (e.g. "cancel only within 1 hour") — guards are pure functions of ctx, not wallclock time
- **Async workflows / sagas** (e.g. "pay → reserve inventory → charge card → send email") — multi-step processes with side effects
- **Database queries in guards** (e.g. "column.cards.length < 20") — guards see model props, not query results
- **Side effects** (send email, create snapshot, call external API) — orchestrator stubs are generated, but logic is user code
- **Conditional relations** (e.g. "supplier exists only if isB2B") — relations are static declarations

dopespec covers: entity state + transitions + access control + cross-model invariants. Not all business logic. This is intentional.

## Implementation order

1. `model()` — ✅ done (10 generators)
2. `decisions()` — ✅ done (schema builder + 3 generators: evaluate, tests, markdown table)
3. `policy()` — ✅ done (schema builder + 4 generators: validator, tests, index, mermaid)
4. `process()` / sagas — if multi-step workflows are ever needed
