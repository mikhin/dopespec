import { describe, expect, it } from "vitest";

import { action } from "../schema/actions.js";
import { rule } from "../schema/constraints.js";
import { model } from "../schema/model.js";
import {
  boolean,
  date,
  lifecycle,
  number,
  oneOf,
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

  it("lifecycle() captures values", () => {
    const states = ["pending", "done"] as const;
    const prop = lifecycle(states);

    expect(prop.kind).toBe("lifecycle");
    expect(prop.values).toEqual(["pending", "done"]);
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
