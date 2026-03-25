# dopespec — Schema-first domain modeling ("Prisma for business logic")

## Core Schema Concepts

- [ ] Models — aggregates (e.g. Order, Pet, Customer)
- [ ] Props — typed fields, value objects
- [ ] Actions — commands (e.g. placeOrder, adopt, return)
- [ ] Transitions — lifecycle states with guards (e.g. pending→paid→shipped)
- [ ] Constraints — executable guards on props/transitions, no free-text strings
- [ ] Zero string literals — strings only in initial definition (as const), everywhere else typed references. Typo = compile error.
- [ ] Relations — has many, belongs to (Prisma-like)
- [ ] Scenarios — typed inline per transition: .scenario(givenProps, expectedState), compile-time checked

## Design Principles

- [ ] Schema as TypeScript builder API — IDE autocomplete, linting, type checking for free
- [ ] Single DSL — models, transitions, constraints, scenarios in one file per model
- [ ] DDD built in — model()=Aggregate, props=VO, transitions=Events, constraints=Invariants, actions=Commands
- [ ] Bounded Contexts — group models by domain, limited interface across boundaries
- [ ] BDD auto-generated — each transition/constraint → test case, zero manual test writing
- [ ] Strict compile-time (invalid props/states don't compile) + runtime (guards) + tests (scenarios)
- [ ] Lifecycle as core concept — human-friendly term for state machines
- [ ] Contract programming — schema = contract between modules
- [ ] Runtime transition guards from schema
- [ ] Rule versioning — schema in git
- [ ] Edits sync to code — re-generate
- [ ] "Prisma for business logic" — confirmed market gap, positioning statement

## Codegen (MVP)

- [ ] TypeScript discriminated unions from props/states
- [ ] Transition functions with runtime guards
- [ ] Service orchestrator skeletons per action
- [ ] Unit tests from scenarios
- [ ] E2E test stubs (skeleton with TODOs)
- [ ] Zod validation from constraints
- [ ] Mermaid diagrams from transitions

## ESLint Plugin (future, not MVP)

- [ ] no-unreachable-state — every state reachable from initial
- [ ] no-deadlock-state — every non-final state has outgoing transition
- [ ] no-duplicate-transitions — no two transitions from same state on same event
- [ ] no-undefined-state — transition references existing state
- [ ] states-complete — every state has at least one transition
- [ ] initial-state-required — model has initial state
- [ ] deterministic-transitions — no more than one unguarded transition per state
- [ ] guarded-transitions-have-scenarios — .when() requires true + false scenarios
- [ ] constraints-have-prevent — constraint without .prevent() is useless
- [ ] no-contradicting-constraints — .allow() and .prevent() on same action
- [ ] no-dead-actions — action defined but unused
- [ ] no-undefined-actions — constraint references existing action
- [ ] actions-reachable — action available in at least one state
- [ ] props-used — every prop used in transitions, constraints, or scenarios
- [ ] no-undefined-props — guard references existing prop
- [ ] relations-mutual — hasMany ↔ belongsTo symmetry
- [ ] no-circular-relations — no A belongsTo B belongsTo A
- [ ] relations-reference-existing-models — relation points to defined model
- [ ] scenarios-required — every transition has at least one scenario
- [ ] scenarios-cover-guards — scenarios cover all guard branches
- [ ] scenarios-use-valid-props — scenario uses only defined props
- [ ] scenarios-use-valid-states — scenario expects only defined states
- [ ] no-string-references — after as const, all references typed

## Non-tech Participation

- [ ] MVP: non-tech reads schema + auto-generated diagrams, comments in PR. Does not edit directly.
- [ ] Future: visual drag-n-drop editor for editing (Cloud, paid)

## Migration Strategy

- [ ] Existing md business specs (permissions, pinned shifts, etc.) are first candidates for migration to schema
- [ ] Incremental adoption — migrate one model at a time, not big bang

## Business Model

- [ ] CLI — open source, npm package, `npx domainspec generate`
- [ ] Cloud — paid SaaS: visual editor, collaboration, hosted diagrams, version history (future, needs BE+FE+DB)
- [ ] CLI proves product works, Cloud sells convenience

## Bootstrap Strategy

- [ ] Self-hosting — generator built with itself, proof that product works
- [ ] v0 generator written by hand
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
