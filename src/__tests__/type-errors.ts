/**
 * Type-level tests: these lines MUST produce compile errors.
 * Each @ts-expect-error comment verifies that the following line is rejected.
 * If tsc --noEmit passes, all expected errors are confirmed.
 */
import {
  action,
  belongsTo,
  hasMany,
  lifecycle,
  model,
  number,
  oneOf,
} from "../schema/index.js";

const states = ["on", "off"] as const;

// --- from() must only accept valid lifecycle states ---

model("BadFrom", {
  props: { status: lifecycle(states) },
  transitions: ({ from }) => ({
    // @ts-expect-error: 'invalid' is not a member of 'on' | 'off'
    t: from("invalid").to("off"),
  }),
});

model("BadTo", {
  props: { status: lifecycle(states) },
  transitions: ({ from }) => ({
    // @ts-expect-error: 'broken' is not a member of 'on' | 'off'
    t: from("on").to("broken"),
  }),
});

// --- prevent() must only accept action keys ---

model("BadPrevent", {
  actions: { doStuff: action<Record<string, unknown>>() },
  constraints: ({ rule }) => ({
    // @ts-expect-error: 'nonexistent' is not 'doStuff'
    c: rule().prevent("nonexistent"),
  }),
  props: { status: lifecycle(states) },
});

// --- scenario expected must be a valid state ---

model("BadScenarioState", {
  props: { count: number(), status: lifecycle(states) },
  transitions: ({ from }) => ({
    // @ts-expect-error: 'invalid' is not a member of 'on' | 'off'
    t: from("off").to("on").scenario({ count: 1 }, "invalid"),
  }),
});

// --- scenario given must match prop types ---

model("BadScenarioGiven", {
  props: { count: number(), status: lifecycle(states) },
  transitions: ({ from }) => ({
    // @ts-expect-error: 'notANumber' is not assignable to number
    t: from("off").to("on").scenario({ count: "notANumber" }, "on"),
  }),
});

// --- when() ctx is typed, not any ---

model("BadWhenProp", {
  props: { count: number(), status: lifecycle(states) },
  transitions: ({ from }) => ({
    t: from("off")
      .to("on")
      // @ts-expect-error: 'nonexistent' does not exist on ctx
      .when((ctx) => ctx.nonexistent > 0),
  }),
});

// --- oneOf values must NOT be valid lifecycle states in from/to ---

const priorities = ["low", "high"] as const;

model("OneOfNotLifecycle", {
  props: {
    priority: oneOf(priorities),
    status: lifecycle(states),
  },
  transitions: ({ from }) => ({
    // @ts-expect-error: 'low' is not a lifecycle state ('on' | 'off')
    t: from("low").to("on"),
  }),
});

// --- hasMany/belongsTo must only accept model outputs or ref(), not plain objects ---

// @ts-expect-error: plain object is not a branded ModelRef
hasMany({ kind: "model" as const, name: "Foo" });

// @ts-expect-error: plain object is not a branded ModelRef
belongsTo({ kind: "model" as const, name: "Bar" });

// --- Multiple lifecycle() props should make from() uncallable ---

const phases = ["init", "done"] as const;

model("DualLifecycle", {
  props: {
    phase: lifecycle(phases),
    status: lifecycle(states),
  },
  transitions: ({ from }) => ({
    // @ts-expect-error: multiple lifecycle() props → StatesOf is never → from() rejects all strings
    t: from("on").to("off"),
  }),
});
