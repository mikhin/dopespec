import type { ActionDef } from "../schema/actions.js";
import type { ConstraintData } from "../schema/constraints.js";
import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";
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
 * Derive the id field name for a relation key. Appends Id/Ids to key as-is.
 * belongsTo "customer" → "customerId"
 * hasMany "item" → "itemIds"
 *
 * Use singular relation keys for clean output (e.g. `item: hasMany(Pet)` not `items`).
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
 * Relies on Function.prototype.toString() returning source text, which is
 * guaranteed by the ECMAScript spec for user-defined functions (not built-ins).
 */

// Matches `(ctx) =>` or `ctx =>` at the start, capturing param name.
// Two explicit alternatives avoid backtracking from optional parens + whitespace.
const GUARD_ARROW_RE = /^(?:\((\w+)\)|(\w+))\s*=>\s*/;

export const guardToSource = (
  guard: (ctx: Record<string, unknown>) => unknown,
): string => {
  try {
    const src = guard.toString();
    const match = GUARD_ARROW_RE.exec(src);

    if (!match) {
      throw guardParseError(
        "Guard must be a single-parameter arrow function: (ctx) => expr. " +
          "Got: " +
          src.slice(0, 80),
      );
    }

    const paramName = match[1] ?? match[2];

    if (paramName !== "ctx") {
      throw guardParseError(
        `Guard parameter must be named "ctx": (ctx) => expr. ` +
          `Got: "${paramName}". ` +
          "Destructured or renamed parameters are not supported by codegen.",
      );
    }

    const rawBody = src.slice(match[0].length).trim();

    // Normalize operator spacing in guard bodies.
    // Function.toString() preserves original formatting which may lack spaces.
    // Insert spaces around operators, then collapse any duplicate spaces.
    const body = rawBody
      .replace(/(\w)([><=!]=?=?)(\w)/g, "$1 $2 $3")
      .replace(/(\w)(&&|\|\|)(\w)/g, "$1 $2 $3")
      .replace(/ {2,}/g, " ");

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

    throw guardParseError(`Failed to serialize guard function: ${message}`);
  }
};

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
export const resolveGuardBody = (
  guard: (ctx: Record<string, unknown>) => unknown,
  body: string,
  model: ModelDef,
): string => {
  // Match `ctx.prop === externalRef` — negative lookaheads prevent matching
  // ctx.x === ctx.y, ctx.x === 'literal', and ctx.x === 42.
  const CTX_EQ_REF =
    /ctx\.(\w+)\s*={2,3}\s*(?!ctx\.|['"`\d])([a-zA-Z_$]\w*\.\w+)/g;
  // Match `externalRef === ctx.prop` (reversed operand order).
  // eslint-disable-next-line sonarjs/slow-regex -- input is a short guard body, not user-supplied
  const REF_EQ_CTX = /(?!ctx\.)([a-zA-Z_$]\w*\.\w+)\s*={2,3}\s*ctx\.(\w+)/g;

  // Build once, reuse across all tryResolve calls.
  const defaults = buildModelDefaults(model);

  const tryResolve = (propName: string): string | undefined => {
    const prop = model.props?.[propName];

    if (!prop || (prop.kind !== "lifecycle" && prop.kind !== "oneOf"))
      return undefined;

    const values = prop.values as readonly string[];

    for (const value of values) {
      try {
        if (guard({ ...defaults, [propName]: value }) === true) {
          return `'${value}'`;
        }
      } catch {
        /* guard may access missing props, skip */
      }
    }

    return undefined;
  };

  let resolved = body;

  // ctx.prop === externalRef
  resolved = resolved.replace(CTX_EQ_REF, (match, propName, refStr) => {
    const value = tryResolve(propName as string);

    return value ? match.replace(refStr as string, value) : match;
  });

  // externalRef === ctx.prop
  resolved = resolved.replace(REF_EQ_CTX, (match, refStr, propName) => {
    const value = tryResolve(propName as string);

    return value ? match.replace(refStr as string, value) : match;
  });

  return resolved;
};

/** Serialize a JS value to embeddable source code (string literal, number, boolean). */
export const valueToSource = (value: unknown): string => {
  if (typeof value === "string")
    return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (value instanceof Date) return `new Date('${value.toISOString()}')`;

  return JSON.stringify(value);
};

/** Return a sensible default value (as source code) for a PropDef kind. */
export const defaultValueForProp = (prop: PropDef): string => {
  switch (prop.kind) {
    case "boolean":
      return "false";

    case "date":
      return "new Date(0)";

    case "lifecycle": // fall through

    case "oneOf": {
      const values = prop.values as readonly string[];

      return `'${values[0]}'`;
    }

    case "number":
      return "0";

    case "string":
      return "''";

    default:
      return assertExhaustive(prop.kind);
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

/**
 * Build default values for all props in a model (as runtime JS values, not source).
 * Used by resolvePolicyGuardBody to probe guard functions.
 */
export const buildModelDefaults = (
  model: ModelDef,
): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {};

  if (!model.props) return defaults;

  for (const [key, prop] of Object.entries(model.props)) {
    switch (prop.kind) {
      case "boolean":
        defaults[key] = false;
        break;

      case "date":
        defaults[key] = new Date(0);
        break;

      case "lifecycle":
      // fall through

      case "oneOf":
        defaults[key] = (prop.values as readonly string[])[0] ?? "";
        break;

      case "number":
        defaults[key] = 0;
        break;

      case "string":
        defaults[key] = "";
        break;
    }
  }

  return defaults;
};

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
export const resolvePolicyGuardBody = (
  guard: PolicyDef["rules"][number]["when"],
  body: string,
  requiresModels: Record<string, ModelDef>,
): string => {
  // Match ctx.KEY.PROP === externalRef (not ctx., not literal)
  const CTX_NESTED_EQ_REF =
    /ctx\.(\w+)\.(\w+)\s*={2,3}\s*(?!ctx\.|['"`\d])([a-zA-Z_$]\w*\.\w+)/g;
  // Match externalRef === ctx.KEY.PROP (reversed operand order)
  const REF_EQ_CTX_NESTED =
    // eslint-disable-next-line sonarjs/slow-regex -- input is a short guard body, not user-supplied
    /(?!ctx\.)([a-zA-Z_$]\w*\.\w+)\s*={2,3}\s*ctx\.(\w+)\.(\w+)/g;

  const tryResolve = (reqKey: string, propName: string): string | undefined => {
    const model = requiresModels[reqKey];

    if (!model?.props) return undefined;

    const prop = model.props[propName];

    if (!prop || (prop.kind !== "lifecycle" && prop.kind !== "oneOf"))
      return undefined;

    const values = prop.values as readonly string[];
    const defaults = buildModelDefaults(model);

    for (const value of values) {
      try {
        const ctx = { [reqKey]: { ...defaults, [propName]: value } };

        if (guard(ctx) === true) {
          return `'${value}'`;
        }
      } catch {
        /* guard may access missing props, skip */
      }
    }

    return undefined;
  };

  let resolved = body;

  // ctx.key.prop === externalRef
  resolved = resolved.replace(
    CTX_NESTED_EQ_REF,
    (match, reqKey, propName, refStr) => {
      const value = tryResolve(reqKey as string, propName as string);

      return value ? match.replace(refStr as string, value) : match;
    },
  );

  // externalRef === ctx.key.prop
  resolved = resolved.replace(
    REF_EQ_CTX_NESTED,
    (match, refStr, reqKey, propName) => {
      const value = tryResolve(reqKey as string, propName as string);

      return value ? match.replace(refStr as string, value) : match;
    },
  );

  return resolved;
};
