# dopespec — Current State Summary

## What's Built

- **Schema builder API** (src/schema/) — model(), lifecycle(), lifecycle.states(), oneOf(), optional(), action() with fields, from(), rule(), hasMany(), belongsTo(), ref()
- **10 codegen generators** (src/codegen/) — types, transitions, events, commands, invariants, orchestrators, tests, e2e-stubs, zod, mermaid
- **122 tests** passing, typecheck clean, lint clean
- **Pet-store example** — Customer, Pet, Order models demonstrating full API

## Key Design Decisions Made

- lifecycle() separate from oneOf() — only lifecycle states valid in transitions
- lifecycle.states('pending', 'paid') returns named object for readable access (states.pending)
- optional() with branded unique symbol — lifecycle props cannot be optional
- Callback API: transitions: ({ from }) => ..., constraints: ({ rule }) => ... — typed factories
- Branded ModelRef — prevents structural spoofing in relations
- action() accepts optional fields metadata for codegen: action<P>({ field: string() })
- Guards must use `ctx` as parameter name — codegen depends on Function.toString()
- Generated files: flat directory, .js extensions, ${modelName}.\*.ts pattern
- No classes, no external runtime deps

## Pending Fixes (before next feature)

1. Remove isOptional from src/schema/index.ts public exports (codegen imports directly from props.ts)
2. Add scenario to Pet release transition

## Next Items

1. Generated/user code separation — generated/ always overwritten, src/ user code imports from generated/
2. src/index.ts entry point — package public API
3. End-to-end proof — run all 10 generators on pet-store, compile result
4. CLI (session 3) — npx dopespec generate
5. Self-hosting — describe dopespec models in its own format

## Stats

- 2710 lines of TypeScript
- 31 files
- 122 tests (schema + codegen + type-errors)
- TypeScript 6.0.2, Vitest, ESLint, Zod (devDep)
