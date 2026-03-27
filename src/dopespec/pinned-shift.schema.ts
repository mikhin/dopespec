import {
  action,
  belongsTo,
  date,
  hasMany,
  lifecycle,
  model,
  number,
  oneOf,
  optional,
  ref,
  string,
} from "../schema/index.js";

// --- PinnedShift ---
//
// Recurring shift pattern. Defines member + position + shift type + dayOfWeek.
// Produces virtual shifts (client-side projections) each week — never stored on server.
//
// Key insight: the PinnedShift entity has a simple lifecycle (active → deleted).
// Most complexity lives in the side effects of transitions (materialization,
// exclusion dates, new assignments) — which are orchestrator concerns, not state machine.

const dayOfWeek = oneOf([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const);

const pinnedShiftStates = lifecycle.states("active", "deleted");

const PinnedShift = model("PinnedShift", {
  props: {
    memberId: string(),
    positionId: string(),
    departmentId: string(),
    shiftTypeId: string(),
    dayOfWeek: dayOfWeek,
    activeFrom: date(),
    breakMinutes: optional(number()),
    // excludedDates: date[]  — see CAN/CANNOT notes below
    status: lifecycle(pinnedShiftStates),
  },

  relations: {
    member: belongsTo(ref("Member")),
    department: belongsTo(ref("Department")),
    position: belongsTo(ref("Position")),
    shiftType: belongsTo(ref("ShiftType")),
    materializedAssignments: hasMany(ref("ShiftAssignment")),
  },

  actions: {
    pin: action<{ assignmentId: string }>({
      assignmentId: string(),
    }),
    unpin: action<{ date: string }>({
      date: string(),
    }),
    editAllFuture: action<{
      date: string;
      memberId: string;
      positionId: string;
      shiftTypeId: string;
      breakMinutes: number;
    }>({
      date: string(),
      memberId: string(),
      positionId: string(),
      shiftTypeId: string(),
      breakMinutes: number(),
    }),
    editThisOnly: action<{
      date: string;
      memberId: string;
      positionId: string;
      shiftTypeId: string;
      breakMinutes: number;
    }>({
      date: string(),
      memberId: string(),
      positionId: string(),
      shiftTypeId: string(),
      breakMinutes: number(),
    }),
    deleteOccurrence: action<{ date: string }>({
      date: string(),
    }),
  },

  // Transitions model the PinnedShift entity's own state changes.
  //
  // pin:             no prior PinnedShift exists → creates a new one (active)
  // editAllFuture:   active → active (template fields updated, activeFrom may shift)
  // editThisOnly:    active → active (date added to excludedDates, side-effect: new ShiftAssignment)
  // deleteOccurrence: active → active (date added to excludedDates, no new assignment)
  // unpin:           active → deleted (occurrences materialized, then pin removed)
  // delete:          active → deleted (pin removed, no materialization)
  //
  // Note: "pin" is a creation action — the transition from(active).to(active) here
  // represents the schema requirement. The real entry point is POST /pinned-shifts
  // which creates the entity. dopespec transitions model state-to-state, not creation.
  transitions: ({ from }) => ({
    editAllFuture: from(pinnedShiftStates.active)
      .to(pinnedShiftStates.active)
      .scenario(
        { memberId: "m1", positionId: "p1", dayOfWeek: "monday" },
        pinnedShiftStates.active,
      ),

    editThisOnly: from(pinnedShiftStates.active)
      .to(pinnedShiftStates.active)
      .scenario(
        { memberId: "m1", positionId: "p1", dayOfWeek: "monday" },
        pinnedShiftStates.active,
      ),

    deleteOccurrence: from(pinnedShiftStates.active)
      .to(pinnedShiftStates.active)
      .scenario(
        { memberId: "m1", dayOfWeek: "tuesday" },
        pinnedShiftStates.active,
      ),

    unpin: from(pinnedShiftStates.active)
      .to(pinnedShiftStates.deleted)
      .scenario(
        { memberId: "m1", dayOfWeek: "monday" },
        pinnedShiftStates.deleted,
      ),

    delete: from(pinnedShiftStates.active)
      .to(pinnedShiftStates.deleted)
      .scenario(
        { memberId: "m1", dayOfWeek: "monday" },
        pinnedShiftStates.deleted,
      ),
  }),

  constraints: ({ rule }) => ({
    // Cannot modify a deleted pin
    cannotEditDeletedPin: rule()
      .when((ctx) => ctx.status === pinnedShiftStates.deleted)
      .prevent("editAllFuture"),

    cannotEditThisOnlyDeletedPin: rule()
      .when((ctx) => ctx.status === pinnedShiftStates.deleted)
      .prevent("editThisOnly"),

    cannotDeleteOccurrenceFromDeletedPin: rule()
      .when((ctx) => ctx.status === pinnedShiftStates.deleted)
      .prevent("deleteOccurrence"),

    cannotUnpinDeletedPin: rule()
      .when((ctx) => ctx.status === pinnedShiftStates.deleted)
      .prevent("unpin"),
  }),
});

export { PinnedShift, pinnedShiftStates, dayOfWeek };
