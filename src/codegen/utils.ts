import type { ActionDef } from "../schema/actions.js";
import type { ConstraintData } from "../schema/constraints.js";
import type { ModelDef } from "../schema/model.js";
import type { PropDef } from "../schema/props.js";
import type { RelationDef } from "../schema/relations.js";
import type { TransitionData } from "../schema/transitions.js";

/**
 * Compile-time exhaustiveness check. Pass the narrowed-to-never value here;
 * if a new variant is added to PropKind (or any union) without updating the
 * switch, TypeScript will error because the value won't be `never`.
 */
const assertExhaustive = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

/** Thrown by guardToSource when the guard function cannot be parsed into embeddable source. */
export type GuardParseError = Error & { readonly guardParse: true };

const guardParseError = (message: string): GuardParseError =>
  Object.assign(new Error(message), {
    guardParse: true as const,
    name: "GuardParseError",
  });

const isGuardParseError = (err: unknown): err is GuardParseError =>
  err instanceof Error && "guardParse" in err;

/**
 * ModelDef's default generics use structural bases (TransitionDefBase, ConstraintDefBase)
 * that omit guard/scenarios/preventedAction fields. At runtime, model() always stores the
 * full TransitionData/ConstraintData/ActionDef objects. These accessors centralize the
 * single unavoidable cast so all generators can work with properly typed data.
 */
export const getTransitions = (model: ModelDef): [string, TransitionData][] => {
  if (!model.transitions) return [];

  return Object.entries(model.transitions) as [string, TransitionData][];
};

export const getConstraints = (model: ModelDef): [string, ConstraintData][] => {
  if (!model.constraints) return [];

  return Object.entries(model.constraints) as [string, ConstraintData][];
};

export const getActions = (model: ModelDef): [string, ActionDef][] => {
  if (!model.actions) return [];

  return Object.entries(model.actions) as [string, ActionDef][];
};

export const getRelations = (model: ModelDef): [string, RelationDef][] => {
  if (!model.relations) return [];

  return Object.entries(model.relations) as [string, RelationDef][];
};

export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Derive the id field name for a relation key. Uses key as-is, no depluralization.
 * belongsTo "customer" → "customerId"
 * hasMany "items" → "itemsIds"
 */
export const relationIdField = (
  key: string,
  kind: "belongsTo" | "hasMany",
): string => {
  if (kind === "belongsTo") return `${key}Id`;

  return `${key}Ids`;
};

/**
 * Extracts the values array from a lifecycle or oneOf PropDef.
 * PropDef<K, V> defaults V to unknown, so switch narrowing on `kind` doesn't
 * narrow `values` to `readonly string[]`. This helper centralizes the cast.
 */
const getEnumValues = (prop: PropDef): readonly string[] =>
  prop.values as readonly string[];

const formatUnionValues = (values: readonly string[]): string =>
  values.map((v) => `'${v}'`).join(" | ");

/** Map a PropDef kind to its TypeScript type string. */
export const propKindToTS = (prop: PropDef): string => {
  switch (prop.kind) {
    case "boolean":
      return "boolean";

    case "date":
      return "Date";

    case "lifecycle":
      return formatUnionValues(getEnumValues(prop));

    case "number":
      return "number";

    case "oneOf":
      return formatUnionValues(getEnumValues(prop));

    case "string":
      return "string";

    default:
      return assertExhaustive(prop.kind);
  }
};

const formatZodEnum = (values: readonly string[]): string => {
  const items = values.map((v) => `'${v}'`).join(", ");

  return `z.enum([${items}])`;
};

/** Map a PropDef kind to its Zod validator string. */
export const propKindToZod = (prop: PropDef): string => {
  switch (prop.kind) {
    case "boolean":
      return "z.boolean()";

    case "date":
      return "z.date()";

    case "lifecycle":
      return formatZodEnum(getEnumValues(prop));

    case "number":
      return "z.number()";

    case "oneOf":
      return formatZodEnum(getEnumValues(prop));

    case "string":
      return "z.string()";

    default:
      return assertExhaustive(prop.kind);
  }
};

/** Find the single lifecycle prop in a model. Returns null if none. */
export const getLifecycleProp = (
  model: ModelDef,
): null | { key: string; values: readonly string[] } => {
  if (!model.props) return null;

  for (const [key, prop] of Object.entries(model.props)) {
    if (prop.kind === "lifecycle") {
      return { key, values: getEnumValues(prop) };
    }
  }

  return null;
};

/**
 * Extract the body of a guard function as source code via Function.toString().
 *
 * Only single-expression arrow functions are supported:
 *   `(ctx) => ctx.total > 0` → `"ctx.total > 0"`
 *
 * Throws on block-body arrows `(ctx) => { ... }` and non-arrow functions.
 *
 * Known limitation: property names or string literals containing "=>" before the
 * actual arrow will break extraction (e.g. `ctx["=>"]`). This is unlikely in
 * domain model guards but not prevented.
 *
 * Relies on Function.prototype.toString() returning source text, which is
 * guaranteed by the ECMAScript spec for user-defined functions (not built-ins).
 */
export const guardToSource = (
  guard: (ctx: Record<string, unknown>) => unknown,
): string => {
  try {
    const src = guard.toString();
    const arrowIdx = src.indexOf("=>");

    if (arrowIdx === -1) {
      throw guardParseError(
        "Guard must be an arrow function. Got: " + src.slice(0, 80),
      );
    }

    // Enforce that the guard uses "ctx" as its parameter name.
    // This ensures generated code references ctx consistently.
    const paramSection = src.slice(0, arrowIdx).trim();
    const paramMatch = /^\(?\s*(\w+)\s*\)?$/.exec(paramSection);

    if (!paramMatch || paramMatch[1] !== "ctx") {
      throw guardParseError(
        `Guard parameter must be named "ctx". Got: "${paramSection}". ` +
          "Destructured or renamed parameters are not supported by codegen.",
      );
    }

    const body = src.slice(arrowIdx + 2).trim();

    if (!body.includes("ctx")) {
      throw guardParseError(
        "Guard function body does not reference 'ctx'. " +
          "This may indicate minified code — codegen requires unminified source. " +
          `Got: "${body.slice(0, 80)}"`,
      );
    }

    if (body.startsWith("{")) {
      throw guardParseError(
        "Block-body arrow functions not supported, use single-expression: " +
          "(ctx) => ctx.total > 0",
      );
    }

    return body;
  } catch (err) {
    if (isGuardParseError(err)) {
      throw err;
    }

    const message = err instanceof Error ? err.message : String(err);

    throw guardParseError(
      `Failed to serialize guard function: ${message}`,
    );
  }
};

/** Convert action fields (Record<string, PropDef>) to a TypeScript type literal. */
export const fieldsToTSType = (
  fields: Record<string, PropDef> | undefined,
): string => {
  if (!fields) return "unknown";
  const entries = Object.entries(fields);

  if (entries.length === 0) return "{}";
  const props = entries
    .map(([key, prop]) => `${key}: ${propKindToTS(prop)}`)
    .join("; ");

  return `{ ${props} }`;
};
