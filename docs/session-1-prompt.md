# Session 1 Prompt

Init a new TypeScript project (pnpm, vitest, strict tsconfig) and implement the core builder API for dopespec.

## Deliverables

1. `src/schema/model.ts` — `model()` function that accepts name + definition object
2. `src/schema/props.ts` — prop type helpers: `string()`, `number()`, `boolean()`, `date()`, `oneOf()`
3. `src/schema/transitions.ts` — `from().to().when().scenario()` builder chain
4. `src/schema/constraints.ts` — `rule().when().prevent()` builder chain
5. `src/schema/actions.ts` — `action<T>()` typed action definition
6. `src/schema/relations.ts` — `hasMany()`, `belongsTo()` relation helpers
7. `src/schema/index.ts` — re-exports all public API
8. `src/examples/pet-store.ts` — working example using the API (Order, Pet, Customer models)
9. Tests for builder API — each builder returns correct typed structure

## Key Constraints

- All state/action/prop references must be typed after initial `as const` definition
- `.scenario(givenProps, expectedState)` — both args compile-time checked against model's props and states
- `from(state).to(state)` — both args typed against model's states union
- `.prevent(action)` — arg typed against model's actions
- No string literals except in `as const` definitions
- No classes, no `this`
- No external dependencies except vitest

## Example of What Should Work After This Session

```typescript
import { model, oneOf, from, rule, action, number, string, hasMany, belongsTo } from './schema'

const states = ['pending', 'paid', 'shipped'] as const

const Order = model('Order', {
  props: {
    total: number(),
    status: oneOf(states),
  },
  transitions: {
    pay: from(states[0]).to(states[1])
      .when(ctx => ctx.total > 0)
      .scenario({ total: 100 }, states[1])
      .scenario({ total: 0 }, states[0]),
  },
  constraints: {
    noop: rule().when(ctx => ctx.total === 0).prevent('addItem'),
  },
  actions: {
    addItem: action<{ productId: string }>(),
  },
})
```

This should compile with zero errors and the test suite should pass.
