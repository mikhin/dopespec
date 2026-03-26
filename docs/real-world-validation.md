# Real-World Validation: dopespec against actual products

Analysis of how dopespec primitives map to two real products built by the author.

## 1. figma-kanban-widget (Figma community widget, paid product)

**What it is:** Kanban board widget inside Figma. Columns, cards, drag-and-drop, assignees, filtering, background customization. Paid via Figma payments (free tier: 8 tasks).

**dopespec coverage: ~40%**

### What dopespec covers:

- **types.ts** (BoardType, ColumnType, TaskType, BoardActions) — `model()` generates all of these
- **board-helpers.ts** (extractTask, insertTask, moveTaskToNewPosition) — orchestrator skeletons + constraints
- **Payment guard** (`UNPAID && totalTasks >= FREE_TASK_LIMIT`) — constraint with guard
- **Tests** (~300 lines of Given/When/Then) — generated from scenarios
- **Message types** (TaskUpdate, TaskUpdated, TaskDeleted) — domain events from transitions

### What dopespec does NOT cover:

- UI components (Figma Widget API, React-like rendering)
- Drag-and-drop, positioning (UI interaction)
- Theme/colors/typography (visual design tokens)
- Figma API integration (useSyncedState, usePropertyMenu)
- Filter logic (simple .filter(), not worth abstracting)

### Key insight:

Board → Column → Task is a **nested structure in one JSON state**, not independent aggregates. No cross-model rules needed. `decisions()` would help if roles/permissions are added.

## 2. figma-comments-copier (Full-stack app: NestJS + Figma plugin)

**What it is:** Transfers comments between Figma files. OAuth auth, async job queue (Bull/Redis), credit-based monetization (Buy Me A Coffee webhooks), rate limiting.

**dopespec coverage: ~50% of business logic**

### What dopespec covers:

**model() — two real lifecycles:**

- TransferJob: `PENDING → IN_PROGRESS → COMPLETED/FAILED`
  - Guard: retry only if IN_PROGRESS > 5 minutes
  - Constraint: idempotency (skip already transferred comments)
- CreditTransaction: `PENDING → COMPLETED/FAILED`
  - Guard: complete only when user linked bmac email

**decisions() — two decision tables:**

- Credit tier mapping: extraItemId → credits (tier_3→5, tier_5→10, tier_12→30, fallback: amount/0.50)
- Transfer comment limit: isPaid × commentCount → allowed/blocked (free: max 20, paid: unlimited)

**Constraints/invariants:**

- Webhook idempotency (event_id unique)
- Credit balance >= 0
- Write access to target file required
- Rate limit: 429 → pause 60s

### What dopespec does NOT cover:

- Async queue processing (Bull, Redis) — infrastructure
- Figma API calls — external integration
- OAuth flow — external protocol (Figma's spec, not ours)
- Webhook HMAC verification — one-line crypto utility
- Parent-child comment ID mapping — runtime data transformation algorithm
- UI components, stores, routing — frontend

### Key insight:

This project is a **stronger fit** than Kanban. Real state machines with guards, real decision tables, real constraints. Cross-model rule exists: "free user cannot transfer > 20 comments" spans User and Transfer — potential `policy()` use case when that primitive is built.

## Summary

| Aspect            | Kanban Widget              | Comments Copier                           |
| ----------------- | -------------------------- | ----------------------------------------- |
| Lifecycles        | None (dynamic columns)     | 2 (TransferJob, CreditTransaction)        |
| Decision tables   | 1 (payment guard, trivial) | 2 (credit tiers, transfer limits)         |
| Constraints       | Few (position, payment)    | Many (idempotency, rate limit, balance)   |
| Cross-model rules | None needed                | 1 (free tier limit spans User + Transfer) |
| dopespec fit      | ~40%                       | ~50% of business logic                    |
| Best primitive    | model() for types          | model() + decisions()                     |
