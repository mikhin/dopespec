import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateCommands, generateDecisionEvaluate, generateDecisionTable, generateDecisionTests, generateE2EStubs, generateEvents, generateInvariants, generateMermaid, generateOrchestrators, generatePolicyIndex, generatePolicyMermaid, generatePolicyTests, generatePolicyValidator, generateTests, generateTransitions, generateTypes, generateZod, } from "../codegen/index.js";
import { guardToSource, relationIdField, resolvePolicyGuardBody, valueToSource, } from "../codegen/utils.js";
import { CreditTier, Customer, NoSuspendedCustomerOrders, Order, Pet, } from "../examples/pet-store.js";
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
        color: optional(oneOf(["red", "blue", "green"])),
        name: string(),
    },
});
// --- generateTypes ---
describe("generateTypes", () => {
    it("generates status union and props interface for Order", () => {
        const output = generateTypes(Order);
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
        const output = generateTypes(Pet);
        expect(output).toContain("PetStatus");
        expect(output).toContain("'available'");
        expect(output).toContain("vaccinated: boolean");
    });
    it("includes relation fields in Order props", () => {
        const output = generateTypes(Order);
        expect(output).toContain("customerId: string; // belongsTo Customer");
        expect(output).toContain("itemIds: string[]; // hasMany Pet");
    });
    it("documents singular relation keys for clean output", () => {
        // Verify pet-store uses singular key "item" not "items"
        const output = generateTypes(Order);
        expect(output).not.toContain("itemsIds");
    });
    it("returns empty string for minimal model", () => {
        expect(generateTypes(Minimal)).toBe("");
    });
    it("generates optional prop with ? marker", () => {
        const output = generateTypes(Pet);
        expect(output).toContain("nickname?: string");
    });
    it("generates required props without ? marker", () => {
        const output = generateTypes(Pet);
        expect(output).toMatch(/\bname: string/);
        expect(output).toMatch(/\bprice: number/);
    });
    it("generates optional oneOf prop with ? and union type", () => {
        const output = generateTypes(WithOptionalEnum);
        expect(output).toContain("color?: WidgetColor");
        expect(output).toContain("name: string");
    });
});
// --- generateTransitions ---
describe("generateTransitions", () => {
    it("generates transition functions with model-prefixed names", () => {
        const output = generateTransitions(Order);
        expect(output).toContain("function OrderPay");
        expect(output).toContain("function OrderShip");
        expect(output).toContain("function OrderCancel");
        expect(output).toContain("function OrderDeliver");
        expect(output).toContain("ctx.status !== 'pending'");
        expect(output).toContain("status: 'paid'");
    });
    it("imports props type from convention path", () => {
        const output = generateTransitions(Order);
        expect(output).toContain("import type { OrderProps } from './order.types.js'");
    });
    it("includes guard check for guarded transitions", () => {
        const output = generateTransitions(Order);
        expect(output).toContain("ctx.total > 0");
        expect(output).toContain("Guard failed");
    });
    it("returns empty string for minimal model", () => {
        expect(generateTransitions(Minimal)).toBe("");
    });
});
// --- generateEvents ---
describe("generateEvents", () => {
    it("generates event types for Order transitions", () => {
        const output = generateEvents(Order);
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
        const output = generateEvents(Order);
        expect(output).toContain("import type { OrderProps } from './order.types.js'");
    });
    it("returns empty string for minimal model", () => {
        expect(generateEvents(Minimal)).toBe("");
    });
});
// --- generateCommands ---
describe("generateCommands", () => {
    it("generates model-prefixed command types with typed payloads", () => {
        const output = generateCommands(Order);
        expect(output).toContain("OrderAddItemCommand");
        expect(output).toContain("OrderRemoveItemCommand");
        expect(output).toContain("type: 'OrderAddItem'");
        expect(output).toContain("productId: string");
        expect(output).toContain("quantity: number");
        expect(output).toContain("OrderCommand");
    });
    it("falls back to unknown payload when no fields", () => {
        const output = generateCommands(NoFields);
        expect(output).toContain("payload: unknown");
    });
    it("generates empty object payload for action({})", () => {
        const output = generateCommands(EmptyFields);
        expect(output).toContain("payload: {}");
    });
    it("returns empty string for minimal model", () => {
        expect(generateCommands(Minimal)).toBe("");
    });
});
// --- generateInvariants ---
describe("generateInvariants", () => {
    it("generates validation functions for Order constraints", () => {
        const output = generateInvariants(Order);
        expect(output).toContain("validateCannotAddWhenCancelled");
        expect(output).toContain("validateCannotRemoveWhenEmpty");
        expect(output).toContain("validateOrder");
        expect(output).toContain("violations");
    });
    it("imports props type from convention path", () => {
        const output = generateInvariants(Order);
        expect(output).toContain("import type { OrderProps } from './order.types.js'");
    });
    it("includes guard negation comment", () => {
        const output = generateInvariants(Order);
        expect(output).toContain("guard=true means violation");
    });
    it("returns empty string for minimal model", () => {
        expect(generateInvariants(Minimal)).toBe("");
    });
});
// --- generateOrchestrators ---
describe("generateOrchestrators", () => {
    it("generates handler skeletons for Order actions", () => {
        const output = generateOrchestrators(Order);
        expect(output).toContain("function handleOrderAddItem");
        expect(output).toContain("function handleOrderRemoveItem");
        expect(output).toContain("productId: string");
        expect(output).toContain("TODO: implement");
        expect(output).toContain("return ctx");
    });
    it("imports props type from convention path", () => {
        const output = generateOrchestrators(Order);
        expect(output).toContain("import type { OrderProps } from '../generated/order.types.js'");
    });
    it("returns empty string for minimal model", () => {
        expect(generateOrchestrators(Minimal)).toBe("");
    });
});
// --- generateTests ---
describe("generateTests", () => {
    it("generates vitest tests from Order scenarios", () => {
        const output = generateTests(Order);
        expect(output).toContain("describe('Order'");
        expect(output).toContain("it('given");
        expect(output).toContain("total");
        expect(output).toContain("expect(");
        expect(output).toContain("import { describe, it, expect } from 'vitest'");
    });
    it("imports transition functions", () => {
        const output = generateTests(Order);
        expect(output).toContain("import { OrderPay");
        expect(output).toContain("from './order.transitions.js'");
    });
    it("uses model-prefixed transition function names", () => {
        const output = generateTests(Order);
        expect(output).toContain("OrderPay(ctx)");
    });
    it("includes relation field defaults in ctx setup", () => {
        const output = generateTests(Order);
        expect(output).toContain("customerId: ''");
        expect(output).toContain("itemIds: []");
    });
    it("generates tests for Pet scenarios", () => {
        const output = generateTests(Pet);
        expect(output).toContain("describe('Pet'");
        expect(output).toContain("price");
    });
    it("returns empty string for model with no scenarios", () => {
        expect(generateTests(Customer)).toBe("");
    });
    it("returns empty string for minimal model", () => {
        expect(generateTests(Minimal)).toBe("");
    });
});
// --- generateE2EStubs ---
describe("generateE2EStubs", () => {
    it("generates e2e stubs for Order transitions", () => {
        const output = generateE2EStubs(Order);
        expect(output).toContain("test('Order: pay flow");
        expect(output).toContain("test('Order: ship flow");
        expect(output).toContain("TODO: setup");
        expect(output).toContain("TODO: act");
        expect(output).toContain("TODO: assert");
        expect(output).toContain("pending");
        expect(output).toContain("paid");
    });
    it("returns empty string for minimal model", () => {
        expect(generateE2EStubs(Minimal)).toBe("");
    });
});
// --- generateZod ---
describe("generateZod", () => {
    it("generates Zod schema for Order props", () => {
        const output = generateZod(Order);
        expect(output).toContain("import { z } from 'zod'");
        expect(output).toContain("OrderSchema");
        expect(output).toContain("z.object");
        expect(output).toContain("z.number()");
        expect(output).toContain("z.date()");
        expect(output).toContain("z.enum(");
        expect(output).toContain("'pending'");
    });
    it("includes relation fields in Zod schema", () => {
        const output = generateZod(Order);
        expect(output).toContain("customerId: z.string()");
        expect(output).toContain("itemIds: z.array(z.string())");
    });
    it("returns empty string for minimal model", () => {
        expect(generateZod(Minimal)).toBe("");
    });
    it("generates .optional() for optional props", () => {
        const output = generateZod(Pet);
        expect(output).toContain("nickname: z.string().optional()");
    });
    it("does not add .optional() to required props", () => {
        const output = generateZod(Pet);
        expect(output).toMatch(/\bname: z\.string\(\),/);
    });
    it("generates .optional() for optional oneOf prop", () => {
        const output = generateZod(WithOptionalEnum);
        expect(output).toContain("z.enum(['red', 'blue', 'green']).optional()");
    });
});
// --- generateMermaid ---
describe("generateMermaid", () => {
    it("generates Mermaid stateDiagram for Order", () => {
        const output = generateMermaid(Order);
        expect(output).toContain("stateDiagram-v2");
        expect(output).toContain("[*] --> pending");
        expect(output).toContain("pending --> paid: pay");
        expect(output).toContain("paid --> shipped: ship");
        expect(output).toContain("pending --> cancelled: cancel");
    });
    it("marks guarded transitions", () => {
        const output = generateMermaid(Order);
        expect(output).toContain("pay [guarded]");
    });
    it("returns empty string for minimal model", () => {
        expect(generateMermaid(Minimal)).toBe("");
    });
});
// --- action() fields ---
describe("action() fields", () => {
    it("stores fields metadata at runtime", () => {
        const a = action({ count: number() });
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
        action({ bad: "not-a-propdef" })).toThrow('action() field "bad" must be a PropDef');
    });
    it("throws on null field values at runtime", () => {
        expect(() => 
        // @ts-expect-error -- intentionally passing null
        action({ bad: null })).toThrow('action() field "bad" must be a PropDef');
    });
});
const asGuard = (fn) => fn;
describe("guardToSource", () => {
    it("extracts body from single-expression arrow", () => {
        const guard = asGuard((ctx) => ctx["total"] > 0);
        expect(guardToSource(guard)).toContain("ctx");
    });
    it("throws on destructured parameter", () => {
        const guard = ({ status }) => status === "active";
        expect(() => guardToSource(guard)).toThrow("Guard must be a single-parameter arrow function");
    });
    it("throws on renamed parameter", () => {
        const guard = (state) => state["total"] > 0;
        expect(() => guardToSource(guard)).toThrow('Guard parameter must be named "ctx": (ctx) => expr');
    });
    it("handles arrow with string containing =>", () => {
        const guard = asGuard((ctx) => ctx["label"] === "a => b");
        const result = guardToSource(guard);
        expect(result).toContain("ctx");
    });
    it("handles logical operators", () => {
        const guard = asGuard((ctx) => ctx["total"] > 0 && ctx["status"] === "active");
        const result = guardToSource(guard);
        expect(result).toContain("ctx");
        expect(result).toContain("active");
    });
    it("handles nested arrow in filter expression", () => {
        const guard = asGuard((ctx) => ctx["items"].filter((i) => i.active)
            .length > 0);
        const result = guardToSource(guard);
        expect(result).toContain("ctx");
        expect(result).toContain("filter");
        expect(result).toContain("active");
        expect(result).toContain(".length > 0");
    });
    it("throws on block-body arrow", () => {
        const guard = asGuard((ctx) => {
            return ctx["total"] > 0;
        });
        expect(() => guardToSource(guard)).toThrow("Block-body arrow functions not supported");
    });
    it("throws on non-arrow function", () => {
        const guard = function (ctx) {
            return ctx["total"] > 0;
        };
        expect(() => guardToSource(guard)).toThrow("Guard must be a single-parameter arrow function");
    });
    it("throws when body does not reference ctx (minification detection)", () => {
        // Simulate a minified guard where param was renamed
        // We manually construct a function whose toString has "ctx =>" but body has "a"
        const guard = {
            toString: () => "(ctx) => a > 0",
        };
        expect(() => guardToSource(guard)).toThrow("does not reference 'ctx'");
    });
    it("handles property access containing => in body", () => {
        const guard = {
            toString: () => '(ctx) => ctx["=>"] === true',
        };
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
        const source = generateTypes(Order) +
            "\n" +
            generateTransitions(Order);
        const result = ts.transpileModule(source, {
            compilerOptions: {
                strict: true,
                target: ts.ScriptTarget.ES2022,
            },
        });
        expect(result.diagnostics ?? []).toHaveLength(0);
    });
    it("types + invariants compile as valid TypeScript", () => {
        const source = generateTypes(Order) +
            "\n" +
            generateInvariants(Order);
        const result = ts.transpileModule(source, {
            compilerOptions: {
                strict: true,
                target: ts.ScriptTarget.ES2022,
            },
        });
        expect(result.diagnostics ?? []).toHaveLength(0);
    });
    it("generated Zod schema parses valid data and rejects invalid data", () => {
        const source = generateZod(Order);
        // Strip import and export keywords — we provide z directly and return the schema
        const body = source
            .replace(/import.*from.*'zod';?\n?/, "")
            .replace(/export /g, "");
        // Evaluate the generated code with z in scope
        // eslint-disable-next-line sonarjs/code-eval -- intentional: validating generated code at runtime
        const factory = new Function("z", `${body}\nreturn OrderSchema;`);
        // eslint-disable-next-line sonarjs/code-eval -- intentional: validating generated code at runtime
        const OrderSchema = factory(z);
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
        const typesSource = generateTypes(Order);
        const transitionsSource = generateTransitions(Order);
        const dir = mkdtempSync(join(tmpdir(), "dopespec-codegen-"));
        try {
            writeFileSync(join(dir, "package.json"), '{"type":"module"}');
            writeFileSync(join(dir, "order.types.ts"), typesSource);
            writeFileSync(join(dir, "order.transitions.ts"), transitionsSource);
            const program = ts.createProgram([join(dir, "order.types.ts"), join(dir, "order.transitions.ts")], {
                module: ts.ModuleKind.NodeNext,
                moduleResolution: ts.ModuleResolutionKind.NodeNext,
                strict: true,
                target: ts.ScriptTarget.ES2022,
            });
            const diagnostics = ts.getPreEmitDiagnostics(program);
            const errors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
            if (errors.length > 0) {
                const messages = errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
                expect(messages).toEqual([]);
            }
            expect(errors).toHaveLength(0);
        }
        finally {
            rmSync(dir, { recursive: true });
        }
    });
});
// --- generateDecisionEvaluate ---
describe("generateDecisionEvaluate", () => {
    it("generates input/output types and evaluate function for CreditTier", () => {
        const output = generateDecisionEvaluate(CreditTier);
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
        const output = generateDecisionEvaluate(d);
        expect(output).toContain("input.a === 1 && input.b === 'yes'");
    });
    it("generates catch-all for empty when", () => {
        const d = decisions("Fallback", {
            inputs: { x: number() },
            outputs: { y: number() },
            rules: [{ then: { y: 0 }, when: {} }],
        });
        const output = generateDecisionEvaluate(d);
        expect(output).toContain("return { y: 0 }");
        expect(output).not.toContain("if ()");
    });
    it("generates oneOf union type for inputs", () => {
        const d = decisions("Access", {
            inputs: { role: oneOf(["admin", "user"]) },
            outputs: { canEdit: boolean() },
            rules: [
                { then: { canEdit: true }, when: { role: "admin" } },
                { then: { canEdit: false }, when: { role: "user" } },
            ],
        });
        const output = generateDecisionEvaluate(d);
        expect(output).toContain("role: 'admin' | 'user'");
    });
    it("compiles as valid TypeScript", () => {
        const source = generateDecisionEvaluate(CreditTier);
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
        const output = generateDecisionTests(CreditTier);
        expect(output).toContain("import { describe, it, expect } from 'vitest'");
        expect(output).toContain("import { evaluateCreditTier }");
        expect(output).toContain("from './credit-tier.evaluate.js'");
        expect(output).toContain("describe('CreditTier'");
        expect(output).toContain("when extraItemId");
        expect(output).toContain("then credits");
        expect(output).toContain("evaluateCreditTier(");
        expect(output).toContain("expect(result).toEqual(");
    });
    it("uses default values for unmatched inputs", () => {
        const output = generateDecisionTests(CreditTier);
        // amount is not in when clause, so should use default 0
        expect(output).toContain("amount: 0");
    });
    it("generates one test per rule", () => {
        const output = generateDecisionTests(CreditTier);
        const matches = output.match(/it\('/g);
        expect(matches).toHaveLength(3);
    });
});
// --- generateDecisionTable ---
describe("generateDecisionTable", () => {
    it("generates markdown table for CreditTier", () => {
        const output = generateDecisionTable(CreditTier);
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
        const output = generateDecisionTable(CreditTier);
        // amount is not in when clause, so should show *
        expect(output).toContain("*");
    });
    it("has correct number of rows (header + separator + rules)", () => {
        const output = generateDecisionTable(CreditTier);
        const lines = output.trim().split("\n");
        // title, blank, header, separator, 3 data rows
        expect(lines).toHaveLength(7);
    });
});
// --- Policy generators ---
// Build model lookup for policy generators
const policyModelLookup = new Map();
policyModelLookup.set("Customer", Customer);
policyModelLookup.set("Order", Order);
policyModelLookup.set("Pet", Pet);
const petStorePolicy = NoSuspendedCustomerOrders;
describe("generatePolicyValidator", () => {
    it("generates context type and validator function", () => {
        const output = generatePolicyValidator([petStorePolicy], policyModelLookup);
        expect(output).toContain("NoSuspendedCustomerOrdersContext");
        expect(output).toContain("order: OrderProps");
        expect(output).toContain("customer: CustomerProps");
        expect(output).toContain("validateNoSuspendedCustomerOrders");
        expect(output).toContain("violations");
        expect(output).toContain("warnings");
    });
    it("imports types from convention paths", () => {
        const output = generatePolicyValidator([petStorePolicy], policyModelLookup);
        expect(output).toContain("import type { CustomerProps } from './customer.types.js'");
        expect(output).toContain("import type { OrderProps } from './order.types.js'");
    });
    it("resolves closure references in guard bodies", () => {
        const output = generatePolicyValidator([petStorePolicy], policyModelLookup);
        // Should resolve customerStates.suspended → 'suspended'
        expect(output).toContain("'suspended'");
        expect(output).not.toContain("customerStates");
    });
    it("maps prevent to violations and warn to warnings", () => {
        const output = generatePolicyValidator([petStorePolicy], policyModelLookup);
        // prevent → violations with stable policyName:rule_N ID
        expect(output).toContain("violations.push('NoSuspendedCustomerOrders:rule_0')");
        // warn → warnings
        expect(output).toContain("warnings.push('NoSuspendedCustomerOrders:rule_1')");
    });
    it("returns empty string for empty policies", () => {
        expect(generatePolicyValidator([], policyModelLookup)).toBe("");
    });
});
describe("generatePolicyIndex", () => {
    it("generates index with model+action mapping", () => {
        const output = generatePolicyIndex([petStorePolicy]);
        expect(output).toContain("policyIndex");
        expect(output).toContain("Order");
        expect(output).toContain("addItem");
        expect(output).toContain("NoSuspendedCustomerOrders");
        expect(output).toContain("as const");
    });
    it("returns empty string for empty policies", () => {
        expect(generatePolicyIndex([])).toBe("");
    });
});
describe("generatePolicyTests", () => {
    it("generates vitest integration tests", () => {
        const output = generatePolicyTests("order", [petStorePolicy], policyModelLookup);
        expect(output).toContain("import { describe, it, expect } from 'vitest'");
        expect(output).toContain("validateNoSuspendedCustomerOrders");
        expect(output).toContain("describe('NoSuspendedCustomerOrders'");
        expect(output).toContain("expect(result");
    });
    it("generates one test per rule", () => {
        const output = generatePolicyTests("order", [petStorePolicy], policyModelLookup);
        const matches = output.match(/it\('/g);
        expect(matches).toHaveLength(2);
    });
    it("tests prevent rules with valid=false", () => {
        const output = generatePolicyTests("order", [petStorePolicy], policyModelLookup);
        expect(output).toContain("expect(result.valid).toBe(false)");
        expect(output).toContain("expect(result.violations).toContain('NoSuspendedCustomerOrders:rule_0')");
    });
    it("tests warn rules with warnings", () => {
        const output = generatePolicyTests("order", [petStorePolicy], policyModelLookup);
        expect(output).toContain("expect(result.warnings).toContain('NoSuspendedCustomerOrders:rule_1')");
    });
    it("returns empty string for empty policies", () => {
        expect(generatePolicyTests("order", [], policyModelLookup)).toBe("");
    });
});
describe("generatePolicyMermaid", () => {
    it("generates Mermaid interaction diagram", () => {
        const output = generatePolicyMermaid("order", [petStorePolicy]);
        expect(output).toContain("graph LR");
        expect(output).toContain("Customer");
        expect(output).toContain("Order");
        expect(output).toContain("NoSuspendedCustomerOrders");
        expect(output).toContain("addItem");
    });
    it("shows relation kind", () => {
        const output = generatePolicyMermaid("order", [petStorePolicy]);
        expect(output).toContain("belongsTo");
    });
    it("shows effect type", () => {
        const output = generatePolicyMermaid("order", [petStorePolicy]);
        expect(output).toContain("prevent/warn");
    });
    it("returns empty string for empty policies", () => {
        expect(generatePolicyMermaid("order", [])).toBe("");
    });
});
describe("resolvePolicyGuardBody", () => {
    it("resolves nested closure references", () => {
        const states = { active: "active", suspended: "suspended" };
        const guard = (ctx) => ctx.customer.status === states.suspended;
        const body = guardToSource(guard);
        const resolved = resolvePolicyGuardBody(guard, body, {
            customer: Customer,
        });
        expect(resolved).toContain("'suspended'");
        expect(resolved).not.toContain("states.suspended");
    });
});
//# sourceMappingURL=codegen.test.js.map