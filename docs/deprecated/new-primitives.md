# dopespec — New Primitives: decisions() and interaction()

## Problem

dopespec `model()` covers single-aggregate domain logic well. Two gaps remain:

1. **Permissions / access control** — decision tables with role × resource × action → result. Not a lifecycle, not a transition. Matrix of inputs → outputs.
2. **Cross-model scenarios** — "Order cannot be paid if Customer is suspended". Tests for behavior spanning multiple models.

## Current Primitives

- `model()` — single aggregate: props, lifecycle, transitions, constraints, actions, relations, scenarios
- Codegen: 10 generators, all `(model: ModelDef) => string`

## New Primitive 1: decisions()

Decision table. Inputs → outputs. No lifecycle, no state machine. Pure function.

### API

```typescript
const MemberPermissions = decisions('MemberPermissions', {
  inputs: {
    editorRole: oneOf(['owner', 'propertyAdmin', 'deptAdmin', 'member', 'terminated'] as const),
    targetRole: oneOf(['owner', 'employee', 'terminated'] as const),
    isSelfEdit: boolean(),
  },

  outputs: {
    editPersonalData: oneOf(['enabled', 'disabled'] as const),
    editOrgRole: oneOf(['enabled', 'disabled'] as const),
    editPropertyRole: oneOf(['enabled', 'disabled', 'filtered'] as const),
    addProperty: oneOf(['visible', 'hidden'] as const),
    inviteSection: oneOf(['shown', 'hidden'] as const),
  },

  rules: [
    { when: { editorRole: 'owner', isSelfEdit: false }, then: { editPersonalData: 'enabled', editOrgRole: 'enabled', addProperty: 'visible', inviteSection: 'shown' } },
    { when: { editorRole: 'owner', isSelfEdit: true }, then: { editPersonalData: 'enabled', editOrgRole: 'disabled', addProperty: 'visible', inviteSection: 'shown' } },
    { when: { editorRole: 'propertyAdmin' }, then: { editPersonalData: 'disabled', editOrgRole: 'disabled', editPropertyRole: 'filtered', addProperty: 'visible', inviteSection: 'hidden' } },
    { when: { editorRole: 'deptAdmin' }, then: { editPersonalData: 'disabled', editOrgRole: 'disabled', editPropertyRole: 'disabled', addProperty: 'hidden', inviteSection: 'hidden' } },
    { when: { editorRole: 'member' }, then: { editPersonalData: 'disabled', editOrgRole: 'disabled', addProperty: 'hidden', inviteSection: 'hidden' } },
    { when: { editorRole: 'terminated' }, then: { editPersonalData: 'disabled', editOrgRole: 'disabled', addProperty: 'hidden', inviteSection: 'hidden' } },
  ],
})
```

### Codegen Output

- `memberPermissions.evaluate.ts` — pure function: `evaluate(inputs) → outputs`
- `memberPermissions.test.ts` — one unit test per rule
- `memberPermissions.table.md` — markdown decision table for non-tech

### Type Safety

- `when` typed against inputs props (Partial)
- `then` typed against outputs props (Partial — unspecified outputs = default/undefined)
- Invalid input/output values = compile error

## New Primitive 2: interaction()

Cross-model scenario. Describes setup across multiple models, an action, and expected result. Generates integration test.

### API

```typescript
const PayActiveCustomer = interaction('PayActiveCustomer', {
  models: { order: Order, customer: Customer },
  given: {
    order: { total: 100, status: 'pending' },
    customer: { status: 'active' },
  },
  action: { model: 'order', do: 'pay' },
  expect: { order: { status: 'paid' } },
})

const PaySuspendedCustomer = interaction('PaySuspendedCustomer', {
  models: { order: Order, customer: Customer },
  given: {
    order: { total: 100, status: 'pending' },
    customer: { status: 'suspended' },
  },
  action: { model: 'order', do: 'pay' },
  expect: 'prevented',
})

const PublishingFlow = interaction('PublishingFlow', {
  models: { schedule: Schedule, department: Department },
  given: {
    schedule: { status: 'draft' },
    department: { criticalErrors: 0 },
  },
  action: { model: 'schedule', do: 'publish' },
  expect: { schedule: { status: 'published' } },
})
```

### Codegen Output

- `pay-active-customer.interaction.test.ts` — integration test with TODO stubs for real data setup
- `publishing-flow.interaction.test.ts` — same

### Type Safety

- `models` — record of model name → ModelDef (branded ModelRef)
- `given` — keys must match models keys, values typed as Partial<InferContext<model.props>>
- `action.model` — must be key from models
- `action.do` — must be transition key from that model
- `expect` — typed per model props, or literal 'prevented'

## Duler Coverage

### With decisions():
- Member edit permissions (80+ test cases) ✅
- Access control matrix (resource × role × action) ✅
- UI visibility patterns (hidden/disabled/filtered) ✅

### With interaction():
- Terminated member cannot be assigned shifts ✅
- Cannot publish if critical errors ✅
- Pinned shift stops when member removed ✅
- Publishing flow (validate → snapshot → emails) ✅
- Invite acceptance flow ✅

### Already covered by model():
- Schedule lifecycle (draft → published → unpublished) ✅
- PinnedShift lifecycle (virtual → materialized) ✅
- Invite lifecycle (pending → accepted → revoked) ✅
- Member lifecycle (active → terminated) ✅

## Implementation Order

1. `decisions()` — schema builder + codegen (evaluate, tests, table)
2. `interaction()` — schema builder + codegen (integration tests)
3. Both use existing prop helpers (oneOf, boolean, string, etc.)
4. Both are standalone primitives alongside model(), not inside model()

## Open Questions

1. decisions() default output — when no rule matches, return undefined or throw?
2. decisions() rule priority — first match wins, or all matching rules merged?
3. interaction() — how does user provide real data at runtime? Generated test has TODOs for setup.
4. Should interaction() group related scenarios? E.g. all "pay" interactions in one file?
5. Naming: `interaction()` vs `scenario()` vs `integration()` vs `usecase()`?
