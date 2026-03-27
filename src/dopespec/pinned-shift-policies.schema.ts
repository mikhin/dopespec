import { belongsTo, hasMany, policy, ref } from "../schema/index.js";

import { PinnedShift } from "./pinned-shift.schema.js";

// ---------------------------------------------------------------------------
// Cross-model policies for PinnedShift
//
// These rules require data from other aggregates (Member, ShiftAssignment)
// and cannot be expressed as single-model constraints.
// ---------------------------------------------------------------------------

// --- NoTerminatedMemberPin ---
// Cannot pin a shift for a terminated member.
// Business rule: Member.isTerminated must be false for pin to proceed.

const NoTerminatedMemberPin = policy("NoTerminatedMemberPin", {
  on: { model: PinnedShift, action: "pin" },
  requires: {
    member: belongsTo(ref("Member")),
  },
  rules: [
    {
      effect: "prevent",
      when: (ctx) => ctx.member.isTerminated === true,
    },
  ],
});

// --- MaxMaterializationCap ---
// Unpin and editAllFuture from a future week are capped at 1 year.
// Cannot materialize more than 52 weeks of occurrences.
//
// Note: dopespec policy binds to a single (model, action) pair.
// This rule applies to both "unpin" and "editAllFuture", so we define
// two separate policies — one per action.

const MaxMaterializationCapOnUnpin = policy("MaxMaterializationCapOnUnpin", {
  on: { model: PinnedShift, action: "unpin" },
  requires: {
    materializedAssignments: hasMany(ref("ShiftAssignment")),
  },
  rules: [
    {
      effect: "prevent",
      // Guard checks if the number of occurrences to materialize exceeds 52 weeks.
      // In practice the orchestrator calculates the date range; this guard models the invariant.
      when: (ctx) => ctx.materializedAssignments.length > 52,
    },
  ],
});

const MaxMaterializationCapOnEditAllFuture = policy(
  "MaxMaterializationCapOnEditAllFuture",
  {
    on: { model: PinnedShift, action: "editAllFuture" },
    requires: {
      materializedAssignments: hasMany(ref("ShiftAssignment")),
    },
    rules: [
      {
        effect: "prevent",
        when: (ctx) => ctx.materializedAssignments.length > 52,
      },
    ],
  },
);

// --- NoPastWeekModification ---
// Past weeks are read-only — no pin/unpin/edit/delete actions allowed.
//
// This is a temporal guard that depends on "current date" context, not just
// entity state. We model it per action that must be blocked.

const NoPastWeekModificationOnUnpin = policy("NoPastWeekModificationOnUnpin", {
  on: { model: PinnedShift, action: "unpin" },
  requires: {
    member: belongsTo(ref("Member")),
  },
  rules: [
    {
      effect: "prevent",
      // In the real orchestrator, the guard compares action.date < currentWeekStart.
      // The policy models the intent; the implementation supplies the date comparison.
      when: (ctx) => ctx.member._isPastWeek === true,
    },
  ],
});

const NoPastWeekModificationOnEditAllFuture = policy(
  "NoPastWeekModificationOnEditAllFuture",
  {
    on: { model: PinnedShift, action: "editAllFuture" },
    requires: {
      member: belongsTo(ref("Member")),
    },
    rules: [
      {
        effect: "prevent",
        when: (ctx) => ctx.member._isPastWeek === true,
      },
    ],
  },
);

const NoPastWeekModificationOnEditThisOnly = policy(
  "NoPastWeekModificationOnEditThisOnly",
  {
    on: { model: PinnedShift, action: "editThisOnly" },
    requires: {
      member: belongsTo(ref("Member")),
    },
    rules: [
      {
        effect: "prevent",
        when: (ctx) => ctx.member._isPastWeek === true,
      },
    ],
  },
);

const NoPastWeekModificationOnDeleteOccurrence = policy(
  "NoPastWeekModificationOnDeleteOccurrence",
  {
    on: { model: PinnedShift, action: "deleteOccurrence" },
    requires: {
      member: belongsTo(ref("Member")),
    },
    rules: [
      {
        effect: "prevent",
        when: (ctx) => ctx.member._isPastWeek === true,
      },
    ],
  },
);

export {
  MaxMaterializationCapOnEditAllFuture,
  MaxMaterializationCapOnUnpin,
  NoPastWeekModificationOnDeleteOccurrence,
  NoPastWeekModificationOnEditAllFuture,
  NoPastWeekModificationOnEditThisOnly,
  NoPastWeekModificationOnUnpin,
  NoTerminatedMemberPin,
};

// ---------------------------------------------------------------------------
// CAN vs CANNOT express in dopespec
// ---------------------------------------------------------------------------
//
// CAN express:
//   - PinnedShift lifecycle: active → deleted (via unpin/delete transitions)
//   - Self-transitions: editAllFuture, editThisOnly, deleteOccurrence (active → active)
//   - Single-model constraints: prevent actions on deleted pins
//   - Cross-model policies: no terminated member pin, materialization cap, past-week guard
//   - Props: all scalar fields (memberId, positionId, dayOfWeek, activeFrom, breakMinutes)
//   - Relations: member, department, position, shiftType, materializedAssignments
//   - Actions with typed payloads: pin, unpin, editAllFuture, editThisOnly, deleteOccurrence
//   - BDD scenarios: one per transition
//   - Domain events: generated per transition (PinnedShiftEditAllFutureEvent, etc.)
//   - Commands: generated per action (PinCommand, UnpinCommand, etc.)
//
// CANNOT express (requires orchestrator/manual code):
//   - excludedDates as date[] — dopespec has no array/list prop type; modeled as side-effect
//   - Virtual shift projection — client-side computation, not a domain entity
//   - Materialization side-effects — unpin/editAllFuture must create N ShiftAssignments;
//     this is orchestrator logic, not a state transition
//   - "Edit this only" creating a new ShiftAssignment — cross-aggregate write in one action
//   - Scope selection UX (dialog "this only" vs "all future") — UI concern, not domain
//   - Temporal guards with "current date" injection — policy guards receive entity context,
//     not ambient time; _isPastWeek is a workaround placeholder
//   - Day-of-week change in editAllFuture — template field update, not a state change
//   - Duplicate pin detection (same member + same day) — TBD in business docs
//   - Publish/unpublish workflow — belongs to PublishedWeekSchedule model, not PinnedShift
//   - Revert draft to snapshot — belongs to scheduling orchestrator
//   - Break override cascade (ShiftType default → template → assignment) — runtime logic
//   - hasUnpublishedChanges computation — derived state, not modeled
