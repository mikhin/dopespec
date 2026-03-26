import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { DecisionDef } from "../schema/decisions.js";
import type { ModelDef } from "../schema/model.js";

import {
  generateCommands,
  generateDecisionEvaluate,
  generateDecisionTable,
  generateDecisionTests,
  generateE2EStubs,
  generateEvents,
  generateInvariants,
  generateMermaid,
  generateOrchestrators,
  generateTests,
  generateTransitions,
  generateTypes,
  generateZod,
} from "../codegen/index.js";
import {
  guardToSource,
  relationIdField,
  valueToSource,
} from "../codegen/utils.js";
import { CreditTier, Customer, Order, Pet } from "../examples/pet-store.js";
import { action } from "../schema/actions.js";
import { decisions } from "../schema/decisions.js";
import { model } from "../schema/model.js";
import { boolean, number, oneOf, optional, string } from "../schema/props.js";

// Minimal model with no optional fields
const Minimal = model("Minimal", {});

// Model with actions but no fields metadata
const NoFields = model("NoFields", {
  actions: {
    doSomething: action(),
  },
});

// Model with action that has explicit empty fields
const EmptyFields = model("EmptyFields", {
  actions: {
    ping: action({}),
  },
});

// Model with an optional oneOf prop
const WithOptionalEnum = model("Widget", {
  props: {
    color: optional(oneOf(["red", "blue", "green"] as const)),
    name: string(),
  },
});

// --- generateTypes ---

describe("generateTypes", () => {
  it("generates status union and props interface for Order", () => {
    const output = generateTypes(Order as ModelDef);

    expect(output).toContain("OrderStatus");
    expect(output).toContain("'pending'");
    expect(output).toContain("'paid'");
    expect(output).toContain("'shipped'");
    expect(output).toContain("'delivered'");
    expect(output).toContain("'cancelled'");
    expect(output).toContain("OrderProps");
    expect(output).toContain("total: number");
    expect(output).toContain("createdAt: Date");
    expect(output).toContain("status: OrderStatus");
  });

  it("generates oneOf types (not lifecycle) for Pet", () => {
    const output = generateTypes(Pet as ModelDef);

    expect(output).toContain("PetStatus");
    expect(output).toContain("'available'");
    expect(output).toContain("vaccinated: boolean");
  });

  it("includes relation fields in Order props", () => {
    const output = generateTypes(Order as ModelDef);

    expect(output).toContain("customerId: string; // belongsTo Customer");
    expect(output).toContain("itemIds: string[]; // hasMany Pet");
  });

  it("documents singular relation keys for clean output", () => {
    // Verify pet-store uses singular key "item" not "items"
    const output = generateTypes(Order as ModelDef);

    expect(output).not.toContain("itemsIds");
  });

  it("returns empty string for minimal model", () => {
    expect(generateTypes(Minimal as ModelDef)).toBe("");
  });

  it("generates optional prop with ? marker", () => {
    const output = generateTypes(Pet as ModelDef);

    expect(output).toContain("nickname?: string");
  });

  it("generates required props without ? marker", () => {
    const output = generateTypes(Pet as ModelDef);

    expect(output).toMatch(/\bname: string/);
    expect(output).toMatch(/\bprice: number/);
  });

  it("generates optional oneOf prop with ? and union type", () => {
    const output = generateTypes(WithOptionalEnum as ModelDef);

    expect(output).toContain("color?: WidgetColor");
    expect(output).toContain("name: string");
  });
});

// --- generateTransitions ---

describe("generateTransitions", () => {
  it("generates transition functions with model-prefixed names", () => {
    const output = generateTransitions(Order as ModelDef);

    expect(output).toContain("function OrderPay");
    expect(output).toContain("function OrderShip");
    expect(output).toContain("function OrderCancel");
    expect(output).toContain("function OrderDeliver");
    expect(output).toContain("ctx.status !== 'pending'");
    expect(output).toContain("status: 'paid'");
  });

  it("imports props type from convention path", () => {
    const output = generateTransitions(Order as ModelDef);

    expect(output).toContain(
      "import type { OrderProps } from './order.types.js'",
    );
  });

  it("includes guard check for guarded transitions", () => {
    const output = generateTransitions(Order as ModelDef);

    expect(output).toContain("ctx.total > 0");
    expect(output).toContain("Guard failed");
  });

  it("returns empty string for minimal model", () => {
    expect(generateTransitions(Minimal as ModelDef)).toBe("");
  });
});

// --- generateEvents ---

describe("generateEvents", () => {
  it("generates event types for Order transitions", () => {
    const output = generateEvents(Order as ModelDef);

    expect(output).toContain("OrderPayEvent");
    expect(output).toContain("OrderShipEvent");
    expect(output).toContain("OrderCancelEvent");
    expect(output).toContain("OrderDeliverEvent");
    expect(output).toContain("type: 'OrderPay'");
    expect(output).toContain("from: 'pending'");
    expect(output).toContain("to: 'paid'");
    expect(output).toContain("timestamp: Date");
    expect(output).toContain("OrderEvent");
  });

  it("imports props type from convention path", () => {
    const output = generateEvents(Order as ModelDef);

    expect(output).toContain(
      "import type { OrderProps } from './order.types.js'",
    );
  });

  it("returns empty string for minimal model", () => {
    expect(generateEvents(Minimal as ModelDef)).toBe("");
  });
});

// --- generateCommands ---

describe("generateCommands", () => {
  it("generates model-prefixed command types with typed payloads", () => {
    const output = generateCommands(Order as ModelDef);

    expect(output).toContain("OrderAddItemCommand");
    expect(output).toContain("OrderRemoveItemCommand");
    expect(output).toContain("type: 'OrderAddItem'");
    expect(output).toContain("productId: string");
    expect(output).toContain("quantity: number");
    expect(output).toContain("OrderCommand");
  });

  it("falls back to unknown payload when no fields", () => {
    const output = generateCommands(NoFields as ModelDef);

    expect(output).toContain("payload: unknown");
  });

  it("generates empty object payload for action({})", () => {
    const output = generateCommands(EmptyFields as ModelDef);

    expect(output).toContain("payload: {}");
  });

  it("returns empty string for minimal model", () => {
    expect(generateCommands(Minimal as ModelDef)).toBe("");
  });
});

// --- generateInvariants ---

describe("generateInvariants", () => {
  it("generates validation functions for Order constraints", () => {
    const output = generateInvariants(Order as ModelDef);

    expect(output).toContain("validateCannotAddWhenCancelled");
    expect(output).toContain("validateCannotRemoveWhenEmpty");
    expect(output).toContain("validateOrder");
    expect(output).toContain("violations");
  });

  it("imports props type from convention path", () => {
    const output = generateInvariants(Order as ModelDef);

    expect(output).toContain(
      "import type { OrderProps } from './order.types.js'",
    );
  });

  it("includes guard negation comment", () => {
    const output = generateInvariants(Order as ModelDef);

    expect(output).toContain("guard=true means violation");
  });

  it("returns empty string for minimal model", () => {
    expect(generateInvariants(Minimal as ModelDef)).toBe("");
  });
});

// --- generateOrchestrators ---

describe("generateOrchestrators", () => {
  it("generates handler skeletons for Order actions", () => {
    const output = generateOrchestrators(Order as ModelDef);

    expect(output).toContain("function handleOrderAddItem");
    expect(output).toContain("function handleOrderRemoveItem");
    expect(output).toContain("productId: string");
    expect(output).toContain("TODO: implement");
    expect(output).toContain("return ctx");
  });

  it("imports props type from convention path", () => {
    const output = generateOrchestrators(Order as ModelDef);

    expect(output).toContain(
      "import type { OrderProps } from './order.types.js'",
    );
  });

  it("returns empty string for minimal model", () => {
    expect(generateOrchestrators(Minimal as ModelDef)).toBe("");
  });
});

// --- generateTests ---

describe("generateTests", () => {
  it("generates vitest tests from Order scenarios", () => {
    const output = generateTests(Order as ModelDef);

    expect(output).toContain("describe('Order'");
    expect(output).toContain("it('given");
    expect(output).toContain("total");
    expect(output).toContain("expect(");
    expect(output).toContain("import { describe, it, expect } from 'vitest'");
  });

  it("imports transition functions", () => {
    const output = generateTests(Order as ModelDef);

    expect(output).toContain("import { OrderPay");
    expect(output).toContain("from './order.transitions.js'");
  });

  it("uses model-prefixed transition function names", () => {
    const output = generateTests(Order as ModelDef);

    expect(output).toContain("OrderPay(ctx)");
  });

  it("includes relation field defaults in ctx setup with TODO", () => {
    const output = generateTests(Order as ModelDef);

    expect(output).toContain("customerId: ''");
    expect(output).toContain("itemIds: []");
    expect(output).toContain("TODO: replace with real test data");
  });

  it("generates tests for Pet scenarios", () => {
    const output = generateTests(Pet as ModelDef);

    expect(output).toContain("describe('Pet'");
    expect(output).toContain("price");
  });

  it("returns empty string for model with no scenarios", () => {
    expect(generateTests(Customer as ModelDef)).toBe("");
  });

  it("returns empty string for minimal model", () => {
    expect(generateTests(Minimal as ModelDef)).toBe("");
  });
});

// --- generateE2EStubs ---

describe("generateE2EStubs", () => {
  it("generates e2e stubs for Order transitions", () => {
    const output = generateE2EStubs(Order as ModelDef);

    expect(output).toContain("test('Order: pay flow");
    expect(output).toContain("test('Order: ship flow");
    expect(output).toContain("TODO: setup");
    expect(output).toContain("TODO: act");
    expect(output).toContain("TODO: assert");
    expect(output).toContain("pending");
    expect(output).toContain("paid");
  });

  it("returns empty string for minimal model", () => {
    expect(generateE2EStubs(Minimal as ModelDef)).toBe("");
  });
});

// --- generateZod ---

describe("generateZod", () => {
  it("generates Zod schema for Order props", () => {
    const output = generateZod(Order as ModelDef);

    expect(output).toContain("import { z } from 'zod'");
    expect(output).toContain("OrderSchema");
    expect(output).toContain("z.object");
    expect(output).toContain("z.number()");
    expect(output).toContain("z.date()");
    expect(output).toContain("z.enum(");
    expect(output).toContain("'pending'");
  });

  it("includes relation fields in Zod schema", () => {
    const output = generateZod(Order as ModelDef);

    expect(output).toContain("customerId: z.string()");
    expect(output).toContain("itemIds: z.array(z.string())");
  });

  it("returns empty string for minimal model", () => {
    expect(generateZod(Minimal as ModelDef)).toBe("");
  });

  it("generates .optional() for optional props", () => {
    const output = generateZod(Pet as ModelDef);

    expect(output).toContain("nickname: z.string().optional()");
  });

  it("does not add .optional() to required props", () => {
    const output = generateZod(Pet as ModelDef);

    expect(output).toMatch(/\bname: z\.string\(\),/);
  });

  it("generates .optional() for optional oneOf prop", () => {
    const output = generateZod(WithOptionalEnum as ModelDef);

    expect(output).toContain("z.enum(['red', 'blue', 'green']).optional()");
  });
});

// --- generateMermaid ---

describe("generateMermaid", () => {
  it("generates Mermaid stateDiagram for Order", () => {
    const output = generateMermaid(Order as ModelDef);

    expect(output).toContain("stateDiagram-v2");
    expect(output).toContain("[*] --> pending");
    expect(output).toContain("pending --> paid: pay");
    expect(output).toContain("paid --> shipped: ship");
    expect(output).toContain("pending --> cancelled: cancel");
  });

  it("marks guarded transitions", () => {
    const output = generateMermaid(Order as ModelDef);

    expect(output).toContain("pay [guarded]");
  });

  it("returns empty string for minimal model", () => {
    expect(generateMermaid(Minimal as ModelDef)).toBe("");
  });
});

// --- action() fields ---

describe("action() fields", () => {
  it("stores fields metadata at runtime", () => {
    const a = action<{ count: number }>({ count: number() });

    expect(a.fields).toBeDefined();
    expect(a.fields?.["count"]?.kind).toBe("number");
  });

  it("works without fields (backwards compatible)", () => {
    const a = action();

    expect(a.fields).toBeUndefined();
  });

  it("accepts multiple field types", () => {
    const a = action({
      active: boolean(),
      name: string(),
      score: number(),
    });

    expect(a.fields?.["name"]?.kind).toBe("string");
    expect(a.fields?.["score"]?.kind).toBe("number");
    expect(a.fields?.["active"]?.kind).toBe("boolean");
  });

  it("throws on invalid field values at runtime", () => {
    expect(() =>
      // @ts-expect-error -- intentionally passing invalid value
      action({ bad: "not-a-propdef" }),
    ).toThrow('action() field "bad" must be a PropDef');
  });

  it("throws on null field values at runtime", () => {
    expect(() =>
      // @ts-expect-error -- intentionally passing null
      action({ bad: null }),
    ).toThrow('action() field "bad" must be a PropDef');
  });
});

// --- guardToSource ---

// Typed helper to create guards matching the codegen signature
type Ctx = Record<string, unknown>;
const asGuard = (fn: (ctx: Ctx) => unknown) => fn;

describe("guardToSource", () => {
  it("extracts body from single-expression arrow", () => {
    const guard = asGuard((ctx) => (ctx["total"] as number) > 0);

    expect(guardToSource(guard)).toContain("ctx");
  });

  it("throws on destructured parameter", () => {
    const guard = ({ status }: Ctx) => status === "active";

    expect(() => guardToSource(guard as (ctx: Ctx) => unknown)).toThrow(
      "Guard must be a single-parameter arrow function",
    );
  });

  it("throws on renamed parameter", () => {
    const guard = (state: Ctx) => (state["total"] as number) > 0;

    expect(() => guardToSource(guard as (ctx: Ctx) => unknown)).toThrow(
      'Guard parameter must be named "ctx": (ctx) => expr',
    );
  });

  it("handles arrow with string containing =>", () => {
    const guard = asGuard((ctx) => ctx["label"] === "a => b");

    const result = guardToSource(guard);

    expect(result).toContain("ctx");
  });

  it("handles logical operators", () => {
    const guard = asGuard(
      (ctx) => (ctx["total"] as number) > 0 && ctx["status"] === "active",
    );

    const result = guardToSource(guard);

    expect(result).toContain("ctx");
    expect(result).toContain("active");
  });

  it("handles nested arrow in filter expression", () => {
    const guard = asGuard(
      (ctx) =>
        (ctx["items"] as Array<{ active: boolean }>).filter((i) => i.active)
          .length > 0,
    );

    const result = guardToSource(guard);

    expect(result).toContain("ctx");
    expect(result).toContain("filter");
    expect(result).toContain("active");
    expect(result).toContain(".length > 0");
  });

  it("throws on block-body arrow", () => {
    const guard = asGuard((ctx) => {
      return (ctx["total"] as number) > 0;
    });

    expect(() => guardToSource(guard)).toThrow(
      "Block-body arrow functions not supported",
    );
  });

  it("throws on non-arrow function", () => {
    const guard = function (ctx: Ctx) {
      return (ctx["total"] as number) > 0;
    };

    expect(() => guardToSource(guard)).toThrow(
      "Guard must be a single-parameter arrow function",
    );
  });

  it("throws when body does not reference ctx (minification detection)", () => {
    // Simulate a minified guard where param was renamed
    // We manually construct a function whose toString has "ctx =>" but body has "a"
    const guard = {
      toString: () => "(ctx) => a > 0",
    } as unknown as (ctx: Ctx) => unknown;

    expect(() => guardToSource(guard)).toThrow("does not reference 'ctx'");
  });

  it("handles property access containing => in body", () => {
    const guard = {
      toString: () => '(ctx) => ctx["=>"] === true',
    } as unknown as (ctx: Ctx) => unknown;

    const result = guardToSource(guard);

    expect(result).toBe('ctx["=>"] === true');
  });
});

// --- valueToSource ---

describe("valueToSource", () => {
  it("escapes single quotes in strings", () => {
    expect(valueToSource("O'Brien")).toBe("'O\\'Brien'");
  });

  it("escapes backslashes in strings", () => {
    expect(valueToSource("a\\b")).toBe("'a\\\\b'");
  });

  it("serializes numbers and booleans", () => {
    expect(valueToSource(42)).toBe("42");
    expect(valueToSource(true)).toBe("true");
  });
});

// --- relationIdField ---

describe("relationIdField", () => {
  it("belongsTo appends Id", () => {
    expect(relationIdField("customer", "belongsTo")).toBe("customerId");
  });

  it("hasMany appends Ids to key as-is", () => {
    expect(relationIdField("item", "hasMany")).toBe("itemIds");
    expect(relationIdField("lineItem", "hasMany")).toBe("lineItemIds");
  });
});

// --- Generated code validity (issue #10) ---

describe("generated code validity", () => {
  it("types + transitions compile as valid TypeScript", () => {
    const source =
      generateTypes(Order as ModelDef) +
      "\n" +
      generateTransitions(Order as ModelDef);

    const result = ts.transpileModule(source, {
      compilerOptions: {
        strict: true,
        target: ts.ScriptTarget.ES2022,
      },
    });

    expect(result.diagnostics ?? []).toHaveLength(0);
  });

  it("types + invariants compile as valid TypeScript", () => {
    const source =
      generateTypes(Order as ModelDef) +
      "\n" +
      generateInvariants(Order as ModelDef);

    const result = ts.transpileModule(source, {
      compilerOptions: {
        strict: true,
        target: ts.ScriptTarget.ES2022,
      },
    });

    expect(result.diagnostics ?? []).toHaveLength(0);
  });

  it("generated Zod schema parses valid data and rejects invalid data", () => {
    const source = generateZod(Order as ModelDef);

    // Strip import and export keywords — we provide z directly and return the schema
    const body = source
      .replace(/import.*from.*'zod';?\n?/, "")
      .replace(/export /g, "");

    // Evaluate the generated code with z in scope
    // eslint-disable-next-line sonarjs/code-eval -- intentional: validating generated code at runtime
    const factory = new Function("z", `${body}\nreturn OrderSchema;`);
    // eslint-disable-next-line sonarjs/code-eval -- intentional: validating generated code at runtime
    const OrderSchema = factory(z) as ReturnType<typeof z.object>;

    // Valid data should parse (includes relation id fields)
    const valid = {
      createdAt: new Date(),
      customerId: "cust-123",
      itemIds: ["pet-1", "pet-2"],
      status: "pending",
      total: 100,
    };

    expect(() => OrderSchema.parse(valid)).not.toThrow();

    // Invalid data should throw
    const invalid = {
      createdAt: "not-a-date",
      status: "nonexistent",
      total: "not-a-number",
    };

    expect(() => OrderSchema.parse(invalid)).toThrow();
  });

  it("multi-file imports resolve: types + transitions as separate files", () => {
    const typesSource = generateTypes(Order as ModelDef);
    const transitionsSource = generateTransitions(Order as ModelDef);

    const dir = mkdtempSync(join(tmpdir(), "dopespec-codegen-"));

    try {
      writeFileSync(join(dir, "package.json"), '{"type":"module"}');
      writeFileSync(join(dir, "order.types.ts"), typesSource);
      writeFileSync(join(dir, "order.transitions.ts"), transitionsSource);

      const program = ts.createProgram(
        [join(dir, "order.types.ts"), join(dir, "order.transitions.ts")],
        {
          module: ts.ModuleKind.NodeNext,
          moduleResolution: ts.ModuleResolutionKind.NodeNext,
          strict: true,
          target: ts.ScriptTarget.ES2022,
        },
      );

      const diagnostics = ts.getPreEmitDiagnostics(program);
      const errors = diagnostics.filter(
        (d) => d.category === ts.DiagnosticCategory.Error,
      );

      if (errors.length > 0) {
        const messages = errors.map((d) =>
          ts.flattenDiagnosticMessageText(d.messageText, "\n"),
        );

        expect(messages).toEqual([]);
      }

      expect(errors).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

// --- generateDecisionEvaluate ---

describe("generateDecisionEvaluate", () => {
  it("generates input/output types and evaluate function for CreditTier", () => {
    const output = generateDecisionEvaluate(CreditTier as DecisionDef);

    expect(output).toContain("export type CreditTierInput");
    expect(output).toContain("extraItemId: string");
    expect(output).toContain("amount: number");
    expect(output).toContain("export type CreditTierOutput");
    expect(output).toContain("credits: number");
    expect(output).toContain("function evaluateCreditTier");
    expect(output).toContain("input.extraItemId === 'tier_3'");
    expect(output).toContain("credits: 5");
    expect(output).toContain("credits: 10");
    expect(output).toContain("credits: 30");
    expect(output).toContain("No matching rule");
  });

  it("generates multi-condition when clause", () => {
    const d = decisions("Multi", {
      inputs: { a: number(), b: string() },
      outputs: { x: number() },
      rules: [{ then: { x: 42 }, when: { a: 1, b: "yes" } }],
    });

    const output = generateDecisionEvaluate(d as DecisionDef);

    expect(output).toContain("input.a === 1 && input.b === 'yes'");
  });

  it("generates catch-all for empty when", () => {
    const d = decisions("Fallback", {
      inputs: { x: number() },
      outputs: { y: number() },
      rules: [{ then: { y: 0 }, when: {} }],
    });

    const output = generateDecisionEvaluate(d as DecisionDef);

    expect(output).toContain("return { y: 0 }");
    expect(output).not.toContain("if ()");
  });

  it("generates oneOf union type for inputs", () => {
    const d = decisions("Access", {
      inputs: { role: oneOf(["admin", "user"] as const) },
      outputs: { canEdit: boolean() },
      rules: [
        { then: { canEdit: true }, when: { role: "admin" } },
        { then: { canEdit: false }, when: { role: "user" } },
      ],
    });

    const output = generateDecisionEvaluate(d as DecisionDef);

    expect(output).toContain("role: 'admin' | 'user'");
  });

  it("compiles as valid TypeScript", () => {
    const source = generateDecisionEvaluate(CreditTier as DecisionDef);

    const result = ts.transpileModule(source, {
      compilerOptions: {
        strict: true,
        target: ts.ScriptTarget.ES2022,
      },
    });

    expect(result.diagnostics ?? []).toHaveLength(0);
  });
});

// --- generateDecisionTests ---

describe("generateDecisionTests", () => {
  it("generates vitest tests for each rule", () => {
    const output = generateDecisionTests(CreditTier as DecisionDef);

    expect(output).toContain("import { describe, it, expect } from 'vitest'");
    expect(output).toContain("import { evaluateCreditTier }");
    expect(output).toContain("from './credittier.evaluate.js'");
    expect(output).toContain("describe('CreditTier'");
    expect(output).toContain("when extraItemId");
    expect(output).toContain("then credits");
    expect(output).toContain("evaluateCreditTier(");
    expect(output).toContain("expect(result).toEqual(");
  });

  it("uses default values for unmatched inputs", () => {
    const output = generateDecisionTests(CreditTier as DecisionDef);

    // amount is not in when clause, so should use default 0
    expect(output).toContain("amount: 0");
  });

  it("generates one test per rule", () => {
    const output = generateDecisionTests(CreditTier as DecisionDef);
    const matches = output.match(/it\('/g);

    expect(matches).toHaveLength(3);
  });
});

// --- generateDecisionTable ---

describe("generateDecisionTable", () => {
  it("generates markdown table for CreditTier", () => {
    const output = generateDecisionTable(CreditTier as DecisionDef);

    expect(output).toContain("# CreditTier");
    expect(output).toContain("amount");
    expect(output).toContain("extraItemId");
    expect(output).toContain("\u2192 credits");
    expect(output).toContain("tier_3");
    expect(output).toContain("tier_5");
    expect(output).toContain("tier_12");
    expect(output).toContain("5");
    expect(output).toContain("10");
    expect(output).toContain("30");
  });

  it("uses * for unmatched inputs", () => {
    const output = generateDecisionTable(CreditTier as DecisionDef);

    // amount is not in when clause, so should show *
    expect(output).toContain("*");
  });

  it("has correct number of rows (header + separator + rules)", () => {
    const output = generateDecisionTable(CreditTier as DecisionDef);
    const lines = output.trim().split("\n");

    // title, blank, header, separator, 3 data rows
    expect(lines).toHaveLength(7);
  });
});
