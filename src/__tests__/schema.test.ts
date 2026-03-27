import { describe, expect, it } from "vitest";

import type {
  InferContext,
  OptionalPropDef,
  PropDef,
} from "../schema/props.js";

import { action } from "../schema/actions.js";
import { rule } from "../schema/constraints.js";
import { decisions } from "../schema/decisions.js";
import { model } from "../schema/model.js";
import { policy } from "../schema/policy.js";
import {
  boolean,
  date,
  lifecycle,
  number,
  oneOf,
  optional,
  OPTIONAL_BRAND,
  string,
} from "../schema/props.js";
import { belongsTo, hasMany } from "../schema/relations.js";
import { from } from "../schema/transitions.js";
import { ref } from "../schema/types.js";

describe("props", () => {
  it("string() returns string prop", () => {
    expect(string()).toEqual({ kind: "string", values: null });
  });

  it("number() returns number prop", () => {
    expect(number()).toEqual({ kind: "number", values: null });
  });

  it("boolean() returns boolean prop", () => {
    expect(boolean()).toEqual({ kind: "boolean", values: null });
  });

  it("date() returns date prop", () => {
    expect(date()).toEqual({ kind: "date", values: null });
  });

  it("oneOf() captures values", () => {
    const states = ["a", "b", "c"] as const;
    const prop = oneOf(states);

    expect(prop.kind).toBe("oneOf");
    expect(prop.values).toEqual(["a", "b", "c"]);
  });

  // as const arrays tested for backward compat; lifecycle.states() is the preferred API
  it("lifecycle() captures values", () => {
    const states = ["pending", "done"] as const;
    const prop = lifecycle(states);

    expect(prop.kind).toBe("lifecycle");
    expect(prop.values).toEqual(["pending", "done"]);
  });

  it("lifecycle.states() creates named state object", () => {
    const states = lifecycle.states("pending", "paid", "shipped");

    expect(states.pending).toBe("pending");
    expect(states.paid).toBe("paid");
    expect(states.shipped).toBe("shipped");
  });

  it("lifecycle.states() throws on duplicate names", () => {
    expect(() => lifecycle.states("a", "b", "a")).toThrow(
      "lifecycle.states() received duplicate name 'a'",
    );
  });

  it("lifecycle.states() result is frozen", () => {
    const states = lifecycle.states("a", "b");

    expect(Object.isFrozen(states)).toBe(true);
  });

  it("lifecycle() accepts lifecycle.states() result", () => {
    const states = lifecycle.states("pending", "done");
    const prop = lifecycle(states);

    expect(prop.kind).toBe("lifecycle");
    expect(prop.values).toEqual(["pending", "done"]);
  });

  it("optional() wraps a prop with optional flag", () => {
    const prop = optional(string());

    expect(prop.kind).toBe("string");
    expect(prop.values).toBe(null);
    expect(OPTIONAL_BRAND in prop).toBe(true);
  });

  it("optional() preserves oneOf values", () => {
    const prop = optional(oneOf(["a", "b"] as const));

    expect(prop.kind).toBe("oneOf");
    expect(prop.values).toEqual(["a", "b"]);
    expect(OPTIONAL_BRAND in prop).toBe(true);
  });

  it("optional() preserves number prop", () => {
    const prop = optional(number());

    expect(prop.kind).toBe("number");
    expect(OPTIONAL_BRAND in prop).toBe(true);
  });

  it("optional() preserves boolean prop", () => {
    const prop = optional(boolean());

    expect(prop.kind).toBe("boolean");
    expect(prop.values).toBe(null);
    expect(OPTIONAL_BRAND in prop).toBe(true);
  });

  it("optional() preserves date prop", () => {
    const prop = optional(date());

    expect(prop.kind).toBe("date");
    expect(prop.values).toBe(null);
    expect(OPTIONAL_BRAND in prop).toBe(true);
  });

  it("optional(lifecycle()) is a compile-time error", () => {
    const states = lifecycle.states("a", "b");

    // @ts-expect-error — lifecycle props cannot be optional
    expect(() => optional(lifecycle(states))).toThrow(
      "lifecycle props cannot be optional",
    );
  });

  it("optional(lifecycle() as any) throws at runtime", () => {
    const states = lifecycle.states("a", "b");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- testing runtime guard
    expect(() => optional(lifecycle(states) as any)).toThrow(
      "lifecycle props cannot be optional",
    );
  });

  it("InferContext makes optional props optional and required props required", () => {
    type Props = {
      age: PropDef<"number", null>;
      name: PropDef<"string", null>;
      phone: OptionalPropDef<PropDef<"string", null>>;
    };
    type Ctx = InferContext<Props>;

    // Required keys are present
    const _checkRequired: Ctx = { age: 1, name: "a" };

    // Optional key is accepted
    const _checkOptional: Ctx = { age: 1, name: "a", phone: "555" };

    // Suppress unused warnings
    expect(_checkRequired).toBeDefined();
    expect(_checkOptional).toBeDefined();
  });
});

describe("transitions (standalone)", () => {
  it("from().to() creates transition with correct states", () => {
    const t = from("pending").to("paid");

    expect(t.kind).toBe("transition");
    expect(t.from).toBe("pending");
    expect(t.to).toBe("paid");
    expect(t.guard).toBeNull();
    expect(t.scenarios).toEqual([]);
  });

  it(".when() stores guard function", () => {
    const guard = () => true;
    const t = from("pending").to("paid").when(guard);

    expect(t.guard).toBe(guard);
  });

  it(".scenario() appends to scenarios", () => {
    const t = from("pending")
      .to("paid")
      .scenario({ total: 100 }, "paid")
      .scenario({ total: 0 }, "pending");

    expect(t.scenarios).toHaveLength(2);
    expect(t.scenarios[0]).toEqual({ expected: "paid", given: { total: 100 } });
    expect(t.scenarios[1]).toEqual({
      expected: "pending",
      given: { total: 0 },
    });
  });

  it("chaining is immutable", () => {
    const t1 = from("a").to("b");
    const t2 = t1.when(() => true);
    const t3 = t1.scenario({ x: 1 }, "b");

    expect(t1.guard).toBeNull();
    expect(t1.scenarios).toHaveLength(0);
    expect(t2.guard).not.toBeNull();
    expect(t3.scenarios).toHaveLength(1);
  });

  it(".when().scenario() together", () => {
    const guard = () => true;
    const t = from("a").to("b").when(guard).scenario({ x: 1 }, "b");

    expect(t.guard).toBe(guard);
    expect(t.scenarios).toHaveLength(1);
  });

  it(".scenario().when() — reverse order", () => {
    const guard = () => false;
    const t = from("a").to("b").scenario({ x: 1 }, "b").when(guard);

    expect(t.guard).toBe(guard);
    expect(t.scenarios).toHaveLength(1);
  });

  it("multiple .when() — last wins", () => {
    const first = () => true;
    const second = () => false;
    const t = from("a").to("b").when(first).when(second);

    expect(t.guard).toBe(second);
  });

  it("multiple .scenario() — accumulates", () => {
    const t = from("a")
      .to("b")
      .scenario({ x: 1 }, "a")
      .scenario({ x: 2 }, "b")
      .scenario({ x: 3 }, "a");

    expect(t.scenarios).toHaveLength(3);
    expect(t.scenarios[0]?.expected).toBe("a");
    expect(t.scenarios[1]?.expected).toBe("b");
    expect(t.scenarios[2]?.expected).toBe("a");
  });
});

describe("constraints (standalone)", () => {
  it("rule() creates empty constraint", () => {
    const c = rule();

    expect(c.kind).toBe("constraint");
    expect(c.guard).toBeNull();
    expect(c.preventedAction).toBeNull();
  });

  it(".when().prevent() stores guard and action", () => {
    const guard = () => true;
    const c = rule().when(guard).prevent("pay");

    expect(c.guard).toBe(guard);
    expect(c.preventedAction).toBe("pay");
  });

  it("chaining is immutable", () => {
    const c1 = rule();
    const c2 = c1.when(() => true);
    const c3 = c1.prevent("x");

    expect(c1.guard).toBeNull();
    expect(c1.preventedAction).toBeNull();
    expect(c2.guard).not.toBeNull();
    expect(c3.preventedAction).toBe("x");
  });

  it(".prevent().when() — reverse order", () => {
    const guard = () => true;
    const c = rule().prevent("x").when(guard);

    expect(c.preventedAction).toBe("x");
    expect(c.guard).toBe(guard);
  });

  it("multiple .prevent() — last wins", () => {
    const c = rule().prevent("first").prevent("second");

    expect(c.preventedAction).toBe("second");
  });

  it("multiple .when() — last wins", () => {
    const first = () => true;
    const second = () => false;
    const c = rule().when(first).when(second);

    expect(c.guard).toBe(second);
  });
});

describe("guard execution", () => {
  it("transition guard can be called and returns expected value", () => {
    const states = ["off", "on"] as const;
    const m = model("Light", {
      props: { brightness: number(), status: lifecycle(states) },
      transitions: ({ from }) => ({
        turnOn: from(states[0])
          .to(states[1])
          .when((ctx) => ctx.brightness > 0),
      }),
    });
    const guard = m.transitions?.turnOn.guard;

    expect(guard).not.toBeNull();
    expect(guard?.({ brightness: 100, status: "off" })).toBe(true);
    expect(guard?.({ brightness: 0, status: "off" })).toBe(false);
  });

  it("constraint guard can be called and returns expected value", () => {
    const states = ["active", "inactive"] as const;
    const m = model("Switch", {
      actions: { toggle: action<Record<string, unknown>>() },
      constraints: ({ rule }) => ({
        noToggleWhenLocked: rule()
          .when((ctx) => ctx.locked === true)
          .prevent("toggle"),
      }),
      props: { locked: boolean(), status: lifecycle(states) },
    });
    const guard = m.constraints?.noToggleWhenLocked.guard;

    expect(guard).not.toBeNull();
    expect(guard?.({ locked: true, status: "active" })).toBe(true);
    expect(guard?.({ locked: false, status: "active" })).toBe(false);
  });

  it("guard on optional prop handles undefined and present values", () => {
    const states = ["draft", "published"] as const;
    const m = model("Article", {
      actions: { publish: action() },
      constraints: ({ rule }) => ({
        subtitleTooLong: rule()
          .when((ctx) => ctx.subtitle !== undefined && ctx.subtitle.length > 50)
          .prevent("publish"),
      }),
      props: {
        status: lifecycle(states),
        subtitle: optional(string()),
        title: string(),
      },
    });
    const guard = m.constraints?.subtitleTooLong.guard;

    expect(guard).not.toBeNull();
    // undefined — guard does not fire
    expect(guard?.({ status: "draft", title: "hi" })).toBe(false);
    // short subtitle — guard does not fire
    expect(guard?.({ status: "draft", subtitle: "short", title: "hi" })).toBe(
      false,
    );
    // long subtitle — guard fires
    expect(
      guard?.({
        status: "draft",
        subtitle: "a".repeat(51),
        title: "hi",
      }),
    ).toBe(true);
  });
});

describe("actions", () => {
  it("action() returns action def", () => {
    const a = action<{ productId: string }>();

    expect(a.kind).toBe("action");
  });
});

describe("relations", () => {
  it("hasMany() returns hasMany relation with model ref", () => {
    const target = model("Other", {});
    const r = hasMany(target);

    expect(r.kind).toBe("hasMany");
    expect(r.target.name).toBe("Other");
  });

  it("belongsTo() returns belongsTo relation with model ref", () => {
    const target = model("Other", {});
    const r = belongsTo(target);

    expect(r.kind).toBe("belongsTo");
    expect(r.target.name).toBe("Other");
  });

  it("ref() creates a forward reference", () => {
    const r = hasMany(ref("FutureModel"));

    expect(r.kind).toBe("hasMany");
    expect(r.target.name).toBe("FutureModel");
  });

  it("ref() trims whitespace", () => {
    const r = ref("  Padded  ");

    expect(r.name).toBe("Padded");
  });

  it('ref("") throws', () => {
    expect(() => ref("")).toThrow("ref() requires a non-empty model name");
  });

  it('ref(" ") throws for whitespace-only', () => {
    expect(() => ref("   ")).toThrow("ref() requires a non-empty model name");
  });
});

describe("model", () => {
  it("assembles all fields with typed callbacks", () => {
    const states = ["pending", "paid"] as const;
    const m = model("Order", {
      actions: {
        addItem: action<{ productId: string }>(),
      },
      constraints: ({ rule }) => ({
        noop: rule()
          .when((ctx) => ctx.total === 0)
          .prevent("addItem"),
      }),
      props: {
        status: lifecycle(states),
        total: number(),
      },
      transitions: ({ from }) => ({
        pay: from(states[0])
          .to(states[1])
          .when((ctx) => ctx.total > 0)
          .scenario({ total: 100 }, states[1])
          .scenario({ total: 0 }, states[0]),
      }),
    });

    expect(m.kind).toBe("model");
    expect(m.name).toBe("Order");
    expect(m.props?.total.kind).toBe("number");
    expect(m.props?.status.kind).toBe("lifecycle");
    expect(m.transitions?.pay.from).toBe("pending");
    expect(m.transitions?.pay.to).toBe("paid");
    expect(m.transitions?.pay.scenarios).toHaveLength(2);
    expect(m.constraints?.noop.preventedAction).toBe("addItem");
    expect(m.actions?.addItem.kind).toBe("action");
  });

  it("works with relations", () => {
    const target = model("Item", {});
    const m = model("Order", {
      relations: {
        items: hasMany(target),
        parent: belongsTo(target),
      },
    });

    expect(m.relations?.items.kind).toBe("hasMany");
    expect(m.relations?.items.target.name).toBe("Item");
    expect(m.relations?.parent.kind).toBe("belongsTo");
  });

  it("works with minimal config", () => {
    const m = model("Empty", {});

    expect(m.kind).toBe("model");
    expect(m.name).toBe("Empty");
  });

  it("trims model name", () => {
    const m = model("  Padded  ", {});

    expect(m.name).toBe("Padded");
  });

  it('model("", {}) throws', () => {
    expect(() => model("", {})).toThrow("model() requires a non-empty name");
  });

  it('model("  ", {}) throws for whitespace-only', () => {
    expect(() => model("   ", {})).toThrow("model() requires a non-empty name");
  });

  it("typed from() constrains states from lifecycle()", () => {
    const states = ["a", "b"] as const;
    const m = model("Test", {
      props: { status: lifecycle(states) },
      transitions: ({ from }) => ({
        move: from(states[0]).to(states[1]),
      }),
    });

    expect(m.transitions?.move.from).toBe("a");
    expect(m.transitions?.move.to).toBe("b");
  });

  it("typed from() works with lifecycle.states() named references", () => {
    const states = lifecycle.states("pending", "paid", "shipped");
    const m = model("Order", {
      props: { status: lifecycle(states), total: number() },
      transitions: ({ from }) => ({
        pay: from(states.pending)
          .to(states.paid)
          .when((ctx) => ctx.total > 0)
          .scenario({ total: 100 }, states.paid)
          .scenario({ total: 0 }, states.pending),
        ship: from(states.paid).to(states.shipped),
      }),
    });

    expect(m.transitions?.pay.from).toBe("pending");
    expect(m.transitions?.pay.to).toBe("paid");
    expect(m.transitions?.ship.from).toBe("paid");
    expect(m.transitions?.ship.to).toBe("shipped");
    expect(m.transitions?.pay.scenarios).toHaveLength(2);
  });

  it("typed prevent constrains to action keys", () => {
    const states = ["open", "closed"] as const;
    const m = model("Gate", {
      actions: {
        lock: action<Record<string, unknown>>(),
        unlock: action<Record<string, unknown>>(),
      },
      constraints: ({ rule }) => ({
        noLockWhenOpen: rule()
          .when((ctx) => ctx.status === states[0])
          .prevent("lock"),
      }),
      props: { status: lifecycle(states) },
    });

    expect(m.constraints?.noLockWhenOpen.preventedAction).toBe("lock");
  });
});

describe("scenario given: partial vs full", () => {
  it("accepts partial given (subset of props)", () => {
    const states = ["off", "on"] as const;
    const m = model("Device", {
      props: {
        label: string(),
        status: lifecycle(states),
        voltage: number(),
      },
      transitions: ({ from }) => ({
        turnOn: from(states[0])
          .to(states[1])
          .scenario({ voltage: 120 }, states[1]),
      }),
    });

    expect(m.transitions?.turnOn.scenarios[0]).toEqual({
      expected: "on",
      given: { voltage: 120 },
    });
  });

  it("accepts full given (all props specified)", () => {
    const states = ["off", "on"] as const;
    const m = model("Device", {
      props: {
        label: string(),
        status: lifecycle(states),
        voltage: number(),
      },
      transitions: ({ from }) => ({
        turnOn: from(states[0])
          .to(states[1])
          .scenario(
            { label: "main", status: states[1], voltage: 120 },
            states[1],
          ),
      }),
    });

    expect(m.transitions?.turnOn.scenarios[0]?.given).toEqual({
      label: "main",
      status: "on",
      voltage: 120,
    });
  });

  it("accepts empty given {}", () => {
    const states = ["a", "b"] as const;
    const m = model("Minimal", {
      props: { status: lifecycle(states) },
      transitions: ({ from }) => ({
        go: from(states[0]).to(states[1]).scenario({}, states[1]),
      }),
    });

    expect(m.transitions?.go.scenarios[0]?.given).toEqual({});
  });
});

describe("edge cases", () => {
  it("oneOf with single value", () => {
    const prop = oneOf(["only"] as const);

    expect(prop.values).toEqual(["only"]);
  });

  it("lifecycle with single value", () => {
    const states = ["sole"] as const;
    const m = model("Single", {
      props: { status: lifecycle(states) },
      transitions: ({ from }) => ({
        loop: from(states[0]).to(states[0]),
      }),
    });

    expect(m.transitions?.loop.from).toBe("sole");
    expect(m.transitions?.loop.to).toBe("sole");
  });

  it("model with multiple oneOf props — they do not leak into lifecycle states", () => {
    const states = ["active", "inactive"] as const;
    const priorities = ["low", "medium", "high"] as const;
    const m = model("Task", {
      props: {
        priority: oneOf(priorities),
        status: lifecycle(states),
      },
      transitions: ({ from }) => ({
        deactivate: from(states[0]).to(states[1]),
      }),
    });

    // Only lifecycle values are valid — oneOf 'low'/'medium'/'high' cannot be used in from/to
    expect(m.transitions?.deactivate.from).toBe("active");
    expect(m.transitions?.deactivate.to).toBe("inactive");
  });
});

// --- decisions() ---

describe("decisions", () => {
  it("creates a valid DecisionDef", () => {
    const d = decisions("Tier", {
      inputs: { score: number() },
      outputs: { level: string() },
      rules: [{ then: { level: "gold" }, when: { score: 100 } }],
    });

    expect(d.kind).toBe("decision");
    expect(d.name).toBe("Tier");
    expect(d.inputs.score.kind).toBe("number");
    expect(d.outputs.level.kind).toBe("string");
    expect(d.rules).toHaveLength(1);
    expect(d.rules[0]?.when).toEqual({ score: 100 });
    expect(d.rules[0]?.then).toEqual({ level: "gold" });
  });

  it("supports multiple rules", () => {
    const d = decisions("Discount", {
      inputs: { tier: string() },
      outputs: { percent: number() },
      rules: [
        { then: { percent: 10 }, when: { tier: "silver" } },
        { then: { percent: 20 }, when: { tier: "gold" } },
        { then: { percent: 30 }, when: { tier: "platinum" } },
      ],
    });

    expect(d.rules).toHaveLength(3);
  });

  it("supports partial when (not all inputs matched)", () => {
    const d = decisions("Route", {
      inputs: { method: string(), path: string() },
      outputs: { handler: string() },
      rules: [{ then: { handler: "healthCheck" }, when: { path: "/health" } }],
    });

    expect(d.rules[0]?.when).toEqual({ path: "/health" });
  });

  it("supports empty when (catch-all)", () => {
    const d = decisions("Default", {
      inputs: { x: number() },
      outputs: { y: number() },
      rules: [{ then: { y: 0 }, when: {} }],
    });

    expect(d.rules[0]?.when).toEqual({});
  });

  it("supports oneOf inputs", () => {
    const d = decisions("Access", {
      inputs: { role: oneOf(["admin", "user"] as const) },
      outputs: { canDelete: boolean() },
      rules: [
        { then: { canDelete: true }, when: { role: "admin" } },
        { then: { canDelete: false }, when: { role: "user" } },
      ],
    });

    expect(d.rules).toHaveLength(2);
  });

  it("supports multiple outputs", () => {
    const d = decisions("Pricing", {
      inputs: { plan: string() },
      outputs: { maxUsers: number(), price: number() },
      rules: [
        { then: { maxUsers: 5, price: 0 }, when: { plan: "free" } },
        { then: { maxUsers: 100, price: 49 }, when: { plan: "pro" } },
      ],
    });

    expect(d.rules[0]?.then).toEqual({ maxUsers: 5, price: 0 });
  });

  it("trims whitespace from name", () => {
    const d = decisions("  Spaced  ", {
      inputs: { x: number() },
      outputs: { y: number() },
      rules: [{ then: { y: 2 }, when: { x: 1 } }],
    });

    expect(d.name).toBe("Spaced");
  });

  it("throws on empty name", () => {
    expect(() =>
      decisions("", {
        inputs: { x: number() },
        outputs: { y: number() },
        rules: [{ then: { y: 2 }, when: { x: 1 } }],
      }),
    ).toThrow("non-empty name");
  });

  it("throws on no inputs", () => {
    expect(() =>
      decisions("Bad", {
        inputs: {},
        outputs: { y: number() },
        rules: [{ then: { y: 0 }, when: {} }],
      }),
    ).toThrow("at least one input");
  });

  it("throws on no outputs", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: {},
        rules: [{ then: {}, when: { x: 1 } }],
      }),
    ).toThrow("at least one output");
  });

  it("throws on no rules", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { y: number() },
        rules: [],
      }),
    ).toThrow("at least one rule");
  });

  it("throws on lifecycle input", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { status: lifecycle(["a", "b"]) },
        outputs: { y: number() },
        rules: [{ then: { y: 1 }, when: { status: "a" } }],
      }),
    ).toThrow("lifecycle");
  });

  it("throws on lifecycle output", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { status: lifecycle(["a", "b"]) },
        rules: [{ then: { status: "a" }, when: { x: 1 } }],
      }),
    ).toThrow("lifecycle");
  });

  it("throws on optional input", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: optional(number()) },
        outputs: { y: number() },
        rules: [{ then: { y: 2 }, when: { x: 1 } }],
      }),
    ).toThrow("optional");
  });

  it("throws on optional output", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { y: optional(number()) },
        rules: [{ then: { y: 2 }, when: { x: 1 } }],
      }),
    ).toThrow("optional");
  });

  it("throws on unknown when key", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { y: number() },
        // @ts-expect-error -- intentionally passing invalid when key
        rules: [{ then: { y: 2 }, when: { z: 1 } }],
      }),
    ).toThrow('when key "z" is not a defined input');
  });

  it("throws on unknown then key", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { y: number() },
        // @ts-expect-error -- intentionally passing invalid then key
        rules: [{ then: { z: 2 }, when: { x: 1 } }],
      }),
    ).toThrow('then key "z" is not a defined output');
  });

  it("throws on missing then key", () => {
    expect(() =>
      decisions("Bad", {
        inputs: { x: number() },
        outputs: { a: number(), b: number() },
        // @ts-expect-error -- intentionally missing output key
        rules: [{ then: { a: 1 }, when: { x: 1 } }],
      }),
    ).toThrow('missing output key "b"');
  });
});

// --- policy() ---

describe("policy", () => {
  const targetModel = model("Order", {
    actions: { addItem: action() },
    props: { status: lifecycle(["pending", "paid"] as const), total: number() },
  });
  const relatedModel = model("Customer", {
    props: {
      name: string(),
      status: lifecycle(["active", "suspended"] as const),
    },
  });

  it("creates a valid PolicyDef", () => {
    const p = policy("NoBadCustomers", {
      on: { action: "addItem", model: targetModel },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        {
          effect: "prevent",
          when: (ctx) => ctx.customer.status === "suspended",
        },
      ],
    });

    expect(p.kind).toBe("policy");
    expect(p.name).toBe("NoBadCustomers");
    expect(p.on.model.name).toBe("Order");
    expect(p.on.action).toBe("addItem");
    expect(Object.keys(p.requires)).toEqual(["customer"]);
    expect(p.rules).toHaveLength(1);
    expect(p.rules[0]?.effect).toBe("prevent");
  });

  it("supports warn effect", () => {
    const p = policy("WarnOnSuspended", {
      on: { action: "addItem", model: targetModel },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        { effect: "warn", when: (ctx) => ctx.customer.status === "suspended" },
      ],
    });

    expect(p.rules[0]?.effect).toBe("warn");
  });

  it("supports hasMany in requires (collections)", () => {
    const p = policy("LimitItems", {
      on: { action: "addItem", model: targetModel },
      requires: { items: hasMany(relatedModel) },
      rules: [{ effect: "prevent", when: (ctx) => ctx.items.length > 10 }],
    });

    expect(p.requires["items"]?.kind).toBe("hasMany");
  });

  it("supports multiple rules", () => {
    const p = policy("MultiRule", {
      on: { action: "addItem", model: targetModel },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        {
          effect: "prevent",
          when: (ctx) => ctx.customer.status === "suspended",
        },
        { effect: "warn", when: (ctx) => ctx.customer.name === "" },
      ],
    });

    expect(p.rules).toHaveLength(2);
    expect(p.rules[0]?.effect).toBe("prevent");
    expect(p.rules[1]?.effect).toBe("warn");
  });

  it("trims whitespace from name", () => {
    const p = policy("  Spaced  ", {
      on: { action: "addItem", model: targetModel },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        { effect: "prevent", when: (ctx) => ctx.customer.status === "x" },
      ],
    });

    expect(p.name).toBe("Spaced");
  });

  it("throws on empty name", () => {
    expect(() =>
      policy("", {
        on: { action: "addItem", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow("non-empty name");
  });

  it("throws on empty action", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow("non-empty string");
  });

  it("throws on action not defined on model", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "nonExistent", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow('"nonExistent" is not a defined action');
  });

  it("skips action validation for ref() models", () => {
    // ref() models don't have actions at definition time — no error
    const p = policy("WithRef", {
      on: { action: "anything", model: ref("FutureModel") },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        {
          effect: "prevent",
          when: (ctx) => ctx.customer.status === "suspended",
        },
      ],
    });

    expect(p.on.action).toBe("anything");
  });

  it("throws on invalid model ref", () => {
    expect(() =>
      policy("Bad", {
        // @ts-expect-error -- intentionally passing invalid model
        on: { action: "x", model: { name: "Fake" } },
        requires: { customer: belongsTo(relatedModel) },
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow("model() or ref()");
  });

  it("throws on empty requires", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "addItem", model: targetModel },
        requires: {},
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow("at least one entry");
  });

  it("throws on no rules", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "addItem", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        rules: [],
      }),
    ).toThrow("at least one rule");
  });

  it("throws on invalid effect", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "addItem", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        // @ts-expect-error -- intentionally passing invalid effect
        rules: [{ effect: "block", when: () => true }],
      }),
    ).toThrow('"prevent" or "warn"');
  });

  it("throws on non-function when", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "addItem", model: targetModel },
        requires: { customer: belongsTo(relatedModel) },
        // @ts-expect-error -- intentionally passing invalid when
        rules: [{ effect: "prevent", when: "not a fn" }],
      }),
    ).toThrow("must be a function");
  });

  it("throws on invalid requires entry", () => {
    expect(() =>
      policy("Bad", {
        on: { action: "addItem", model: targetModel },
        // @ts-expect-error -- intentionally passing invalid requires
        requires: { customer: { kind: "invalid" } },
        rules: [{ effect: "prevent", when: () => true }],
      }),
    ).toThrow("belongsTo() or hasMany()");
  });

  it("accepts ref() in on.model", () => {
    const p = policy("WithRef", {
      on: { action: "create", model: ref("FutureModel") },
      requires: { customer: belongsTo(relatedModel) },
      rules: [
        {
          effect: "prevent",
          when: (ctx) => ctx.customer.status === "suspended",
        },
      ],
    });

    expect(p.on.model.name).toBe("FutureModel");
  });
});
