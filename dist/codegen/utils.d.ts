import type { ActionDef } from "../schema/actions.js";
import type { ConstraintData } from "../schema/constraints.js";
import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";
import type { PropDef } from "../schema/props.js";
import type { RelationDef } from "../schema/relations.js";
import type { TransitionData } from "../schema/transitions.js";
/** Thrown by guardToSource when the guard function cannot be parsed into embeddable source. */
export type GuardParseError = Error & {
    readonly guardParse: true;
};
/**
 * ModelDef's default generics use structural bases (TransitionDefBase, ConstraintDefBase)
 * that omit guard/scenarios/preventedAction fields. At runtime, model() always stores the
 * full TransitionData/ConstraintData/ActionDef objects. These accessors centralize the
 * single unavoidable cast so all generators can work with properly typed data.
 */
export declare const getTransitions: (model: ModelDef) => [string, TransitionData][];
export declare const getConstraints: (model: ModelDef) => [string, ConstraintData][];
export declare const getActions: (model: ModelDef) => [string, ActionDef][];
export declare const getRelations: (model: ModelDef) => [string, RelationDef][];
export declare const capitalize: (s: string) => string;
/** Converts PascalCase to kebab-case: "ContrastThresholds" → "contrast-thresholds" */
export declare const toKebabCase: (name: string) => string;
/**
 * Derive the id field name for a relation key. Appends Id/Ids to key as-is.
 * belongsTo "customer" → "customerId"
 * hasMany "item" → "itemIds"
 *
 * Use singular relation keys for clean output (e.g. `item: hasMany(Pet)` not `items`).
 */
export declare const relationIdField: (key: string, kind: "belongsTo" | "hasMany") => string;
/** Map a PropDef kind to its TypeScript type string. */
export declare const propKindToTS: (prop: PropDef) => string;
/** Map a PropDef kind to its Zod validator string. */
export declare const propKindToZod: (prop: PropDef) => string;
/** Find the single lifecycle prop in a model. Returns null if none. */
export declare const getLifecycleProp: (model: ModelDef) => null | {
    key: string;
    values: readonly string[];
};
export declare const guardToSource: (guard: (ctx: Record<string, unknown>) => unknown) => string;
/**
 * Resolve external closure references in a guard body by probing the guard
 * function with known enum/lifecycle values from the model.
 *
 * Guards like `(ctx) => ctx.status === orderStates.cancelled` serialize to a
 * body containing `orderStates.cancelled` — an identifier that doesn't exist
 * in generated code. This function detects such references and replaces them
 * with their resolved string literal values.
 *
 * Works by finding `ctx.prop === ref` or `ref === ctx.prop` patterns, then
 * calling the guard with each possible enum value until one matches.
 *
 * Limitations:
 * - Only matches single-dot refs like `states.cancelled`, not deeper paths.
 *   This is intentional — lifecycle.states() produces `{ name: name }` objects.
 * - Only matches `===` / `==` operators. `!==` / `!=` are not matched by the
 *   regex and will pass through unchanged (the external ref stays in the body).
 */
export declare const resolveGuardBody: (guard: (ctx: Record<string, unknown>) => unknown, body: string, model: ModelDef) => string;
/** Serialize a JS value to embeddable source code (string literal, number, boolean). */
export declare const valueToSource: (value: unknown) => string;
/** Return a sensible default value (as source code) for a PropDef kind. */
export declare const defaultValueForProp: (prop: PropDef) => string;
/** Convert action fields (Record<string, PropDef>) to a TypeScript type literal. */
export declare const fieldsToTSType: (fields: Record<string, PropDef> | undefined) => string;
/**
 * Build default values for all props in a model (as runtime JS values, not source).
 * Used by resolvePolicyGuardBody to probe guard functions.
 */
export declare const buildModelDefaults: (model: ModelDef) => Record<string, unknown>;
/**
 * Resolve external closure references in a policy guard body.
 *
 * Policy guards access nested ctx: `ctx.customer.status === customerStates.suspended`.
 * This function resolves `customerStates.suspended` to `'suspended'` by probing the
 * guard function with known enum values from the required models.
 *
 * @param guard - The guard function (closure with captured variables)
 * @param body - Raw guard body from guardToSource
 * @param requiresModels - Map of requires key → resolved ModelDef
 */
export declare const resolvePolicyGuardBody: (guard: PolicyDef["rules"][number]["when"], body: string, requiresModels: Record<string, ModelDef>) => string;
//# sourceMappingURL=utils.d.ts.map