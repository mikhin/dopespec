# dopespec — Schema-first domain modeling ("Prisma for business logic")

## Honest Scope

dopespec covers **entity state + transitions + access control + cross-model invariants**.

It does NOT cover async workflows, database queries in guards, side effects, or time-based constraints. See `docs/three-primitives.md` for details.

## Core Schema Concepts

- [x] Models — aggregates (e.g. Order, Pet, Customer)
- [x] Props — typed fields, value objects
- [x] Actions — commands (e.g. placeOrder, adopt, return)
- [x] Transitions — lifecycle states with guards (e.g. pending→paid→shipped)
- [x] Constraints — executable guards on props/transitions, no free-text strings
- [x] Zero string literals — strings only in initial definition (as const), everywhere else typed references. Typo = compile error. Codegen resolves closure refs (e.g. `orderStates.cancelled`) to literals at generation time.
- [x] Relations — has many, belongs to (Prisma-like)
- [x] Scenarios — typed inline per transition: .scenario(givenProps, expectedState), compile-time checked
- [x] Decision tables — `decisions()` primitive: inputs → outputs → evaluate function + tests + markdown table
- [x] Decisions linked to model props — decisions() inputs can reference model props for shared type safety

## Design Principles

- [x] Schema as TypeScript builder API — IDE autocomplete, linting, type checking for free
- [x] Single DSL — models, transitions, constraints, scenarios in one file per model
- [x] DDD built in — model()=Aggregate, props=VO, transitions=Events, constraints=Invariants, actions=Commands
- [ ] Bounded Contexts — group models by domain, limited interface across boundaries
- [x] BDD auto-generated — each transition/constraint → test case, zero manual test writing
- [x] Strict compile-time (invalid props/states don't compile) + runtime (guards) + tests (scenarios)
- [x] Lifecycle as core concept — human-friendly term for state machines
- [x] Contract programming — schema = contract between modules
- [x] Runtime transition guards from schema
- [x] Rule versioning — schema in git
- [ ] Edits sync to code — re-generate
- [ ] "Prisma for business logic" — confirmed market gap, positioning statement

## Codegen (MVP)

### model() generators — ✅ all done

- [x] TypeScript discriminated unions from props/lifecycle states
- [x] Transition functions with runtime guards
- [x] Domain event types per transition (DDD: transitions=Events)
- [x] Command types per action (DDD: actions=Commands)
- [x] Invariant validation per constraint (DDD: constraints=Invariants)
- [x] Service orchestrator skeletons per action
- [x] Unit tests in Given/When/Then style from scenarios (BDD)
- [x] E2E test stubs (skeleton with TODOs)
- [x] Zod validation from constraints
- [x] Mermaid diagrams from transitions

### decisions() generators — ✅ all done

- [x] Evaluate function (pure function: inputs → outputs)
- [x] Unit tests (one test per rule, Given/When/Then)
- [x] Markdown decision table (for non-tech readers)

### Pending improvements

- [ ] ModelDef.props is always optional even when model was created with props — tighten with conditional type

### Cross-model generators — deferred

- [ ] Policy validator or extended constraint validation
- [ ] Integration tests from cross-model scenarios
- [ ] Interaction diagrams

## ESLint Plugin (future, not MVP)

- [ ] no-unreachable-state — every state reachable from initial
- [ ] no-deadlock-state — every non-final state has outgoing transition
- [ ] no-duplicate-transitions — no two transitions from same state on same event
- [x] no-undefined-state — transition references existing state (enforced at type level via StatesOf)
- [ ] states-complete — every state has at least one transition
- [ ] initial-state-required — model has initial state
- [ ] deterministic-transitions — no more than one unguarded transition per state
- [ ] guarded-transitions-have-scenarios — .when() requires true + false scenarios
- [ ] constraints-have-prevent — constraint without .prevent() is useless
- [ ] no-contradicting-constraints — .allow() and .prevent() on same action
- [ ] no-dead-actions — action defined but unused
- [x] no-undefined-actions — constraint references existing action (enforced at type level via ActionKeys)
- [ ] actions-reachable — action available in at least one state
- [ ] props-used — every prop used in transitions, constraints, or scenarios
- [ ] no-undefined-props — guard references existing prop
- [ ] relations-mutual — hasMany ↔ belongsTo symmetry
- [ ] no-circular-relations — no A belongsTo B belongsTo A
- [ ] relations-reference-existing-models — relation points to defined model
- [ ] scenarios-required — every transition has at least one scenario
- [ ] scenarios-cover-guards — scenarios cover all guard branches
- [x] scenarios-use-valid-props — scenario uses only defined props (enforced at type level via Partial<InferContext>)
- [x] scenarios-use-valid-states — scenario expects only defined states (enforced at type level via StatesOf)
- [x] no-string-references — after as const, all references typed (enforced at type level via callbacks)

## Non-tech Participation

- [ ] MVP: non-tech reads schema + auto-generated diagrams, comments in PR. Does not edit directly.
- [ ] Future: visual drag-n-drop editor for editing (Cloud, paid)

## Migration Strategy

- [ ] Existing md business specs (permissions, pinned shifts, etc.) are first candidates for migration to schema
- [ ] Incremental adoption — migrate one model at a time, not big bang

## Business Model

- [ ] CLI — open source, npm package, `npx dopespec generate`
- [ ] Cloud — paid SaaS: visual editor, collaboration, hosted diagrams, version history (future, needs BE+FE+DB)
- [ ] CLI proves product works, Cloud sells convenience

## Bootstrap Strategy

- [ ] Self-hosting — generator built with itself, proof that product works
- [x] v0 generator written by hand
- [x] E2E proof — all 13 generators on pet-store, output written to files, compiled with strict tsc
- [ ] Generator's own models described in its own schema
- [ ] v0 generates v1, v1 generates v2
- [ ] First external customer adopts CLI as dev dependency, runs codegen in their repo

## Influenced By

- Nick Tune DSL (declarative state definitions, TypeScript, DDD aggregate)
- Prisma (schema → codegen pipeline)
- OpenAPI (spec-first → generated types/client)
- XState / Stately Studio (state machine concepts)
- Specification by Example (executable specs)
- BRMS (business rules engines for non-tech)
- Cucumber / Gherkin (BDD, Given/When/Then format)
- Decision tables (structured business rules format)
- FSD / Feature-Sliced Design (feature-oriented organization)
- Clean Architecture / Use Cases (orchestrator pattern)
- Nanostores mapCreator (class-like pattern without classes)
