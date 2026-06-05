import type { ModelDef } from "../schema/model.js";
import type { PolicyDef, PolicyRule } from "../schema/policy.js";
import type { PropDef } from "../schema/props.js";

import {
  buildModelDefaults,
  capitalize,
  defaultValueForProp,
  guardToSource,
  relationIdField,
  resolvePolicyGuardBody,
  toKebabCase,
  valueToSource,
} from "./utils.js";

/** Cap on the satisfying-assignment search space, per rule. */
const MAX_COMBINATIONS = 50_000;

/**
 * Generate integration tests for all policies targeting a single model.
 * Output: generated/${targetModel}.policy.test.ts
 */
export const generatePolicyTests = (
  targetModelName: string,
  policies: PolicyDef[],
  modelLookup: Map<string, ModelDef>,
): string => {
  if (policies.length === 0) return "";

  const lines: string[] = [];
  const targetKey = toKebabCase(targetModelName);

  emitTestImports(lines, targetKey, policies);

  for (const policy of policies) {
    emitPolicyTestBlock(lines, policy, modelLookup);
  }

  return lines.join("\n");
};

type CtxModel = {
  key: string;
  kind: "array" | "object";
  model: ModelDef | undefined;
};

type Slot = { candidates: readonly unknown[]; key: string; prop: string };

/** Advance the odometer; returns false when it wraps fully (search exhausted). */
function advance(indices: number[], slots: Slot[]): boolean {
  for (let d = slots.length - 1; d >= 0; d--) {
    const slot = slots[d];

    if (!slot) continue;

    const next = (indices[d] ?? 0) + 1;

    if (next < slot.candidates.length) {
      indices[d] = next;

      return true;
    }

    indices[d] = 0;
  }

  return false;
}

function applyOverrides(
  target: Record<string, unknown>,
  slots: Slot[],
  indices: number[],
): void {
  slots.forEach((slot, i) => {
    const obj = target[slot.key];

    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      (obj as Record<string, unknown>)[slot.prop] =
        slot.candidates[indices[i] ?? 0];
    }
  });
}

/** A defaults-filled value for a ctx key: a single object, or a one-element array for hasMany. */
function blankCtxValue(
  kind: "array" | "object",
  model: ModelDef | undefined,
): unknown {
  const defaults = model ? buildModelDefaults(model) : {};

  if (kind === "array") return model ? [{ ...defaults }] : [];

  return { ...defaults };
}

/** Build a nested ctx from defaults, then apply the current slot candidates. */
function buildProbeCtx(
  ctxModels: CtxModel[],
  slots: Slot[],
  indices: number[],
): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};

  for (const { key, kind, model } of ctxModels) {
    ctx[key] = blankCtxValue(kind, model);
  }

  applyOverrides(ctx, slots, indices);

  return ctx;
}

/** One probeable prop per slot, drawn from the target and belongsTo (object) models. */
function buildSlots(rawBody: string, ctxModels: CtxModel[]): Slot[] {
  const numberLiterals = extractNumberLiterals(rawBody);
  const stringLiterals = extractStringLiterals(rawBody);
  const slots: Slot[] = [];

  for (const { key, kind, model } of ctxModels) {
    if (kind !== "object" || !model?.props) continue;

    const defaults = buildModelDefaults(model);

    for (const [prop, propDef] of Object.entries(model.props)) {
      slots.push({
        candidates: candidatesForProp(
          propDef,
          defaults[prop],
          numberLiterals,
          stringLiterals,
        ),
        key,
        prop,
      });
    }
  }

  return slots;
}

/** Candidate values to probe for a prop, default value first. */
function candidatesForProp(
  prop: PropDef,
  defaultValue: unknown,
  numberLiterals: readonly number[],
  stringLiterals: readonly string[],
): readonly unknown[] {
  if (prop.kind === "lifecycle" || prop.kind === "oneOf") {
    return prop.values as readonly string[];
  }

  if (prop.kind === "boolean") return [false, true];

  if (prop.kind === "number") return dedupe([0, ...numberLiterals]);

  if (prop.kind === "string") return dedupe(["", ...stringLiterals]);

  // date and any future kind: not probed, pinned to its default.
  return [defaultValue];
}

function collectAssignment(
  ctxModels: CtxModel[],
  slots: Slot[],
  indices: number[],
): Record<string, Record<string, unknown>> {
  const assignment: Record<string, Record<string, unknown>> = {};

  for (const { key, kind, model } of ctxModels) {
    if (kind === "object" && model) {
      assignment[key] = { ...buildModelDefaults(model) };
    }
  }

  applyOverrides(assignment, slots, indices);

  return assignment;
}

/** The shape of the validator's ctx: the target model plus each required relation. */
function ctxModelsFor(
  onKey: string,
  onModel: ModelDef | undefined,
  policy: PolicyDef,
  requiresModels: Record<string, ModelDef>,
): CtxModel[] {
  const models: CtxModel[] = [];

  if (onModel) models.push({ key: onKey, kind: "object", model: onModel });

  for (const [key, rel] of Object.entries(policy.requires)) {
    models.push({
      key,
      kind: rel.kind === "hasMany" ? "array" : "object",
      model: requiresModels[key],
    });
  }

  return models;
}

function dedupe<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * Emit an object-literal fixture for a model from a value map. Props equal to
 * their default render via defaultValueForProp (stable formatting, e.g.
 * `new Date(0)`); overridden props render via valueToSource. Relation id fields
 * are appended as empty defaults, matching the generated Props shape.
 */
function emitModelLiteral(
  model: ModelDef | undefined,
  values: Record<string, unknown>,
): string {
  if (!model?.props) return "{}";

  const defaults = buildModelDefaults(model);
  const entries: string[] = [];

  for (const [key, prop] of Object.entries(model.props).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const value = values[key];
    const source = isDefaultValue(prop, value, defaults[key])
      ? defaultValueForProp(prop)
      : valueToSource(value);

    entries.push(`${key}: ${source}`);
  }

  if (model.relations) {
    for (const [key, rel] of Object.entries(model.relations).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const field = relationIdField(key, rel.kind);

      entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
    }
  }

  return `{ ${entries.join(", ")} }`;
}

function emitPolicyTestBlock(
  lines: string[],
  policy: PolicyDef,
  modelLookup: Map<string, ModelDef>,
): void {
  const policyName = capitalize(policy.name);
  const validateFn = `validate${policyName}`;
  const requiresModels = resolveRequiresModels(policy, modelLookup);

  lines.push(`describe('${policy.name}', () => {`);

  for (const [i, rule] of policy.rules.entries()) {
    if (i > 0) lines.push("");
    emitRuleTest(lines, i, rule, policy, validateFn, requiresModels, modelLookup);
  }

  lines.push(`});`);
  lines.push("");
}

function emitRuleTest(
  lines: string[],
  index: number,
  rule: PolicyRule,
  policy: PolicyDef,
  validateFn: string,
  requiresModels: Record<string, ModelDef>,
  modelLookup: Map<string, ModelDef>,
): void {
  const rawBody = guardToSource(
    rule.when as (ctx: Record<string, unknown>) => unknown,
  );
  const guardBody = resolvePolicyGuardBody(rule.when, rawBody, requiresModels);
  const ruleId = `${policy.name}:rule_${String(index)}`;
  // Guard body in test description for readability; stable ID in assertion.
  const escapedBody = guardBody.replace(/'/g, "\\'");

  const onModel = modelLookup.get(policy.on.model.name);
  const onKey = policy.on.model.name.toLowerCase();
  const assignment = findSatisfyingAssignment(
    rule,
    rawBody,
    onKey,
    onModel,
    policy,
    requiresModels,
  );

  // No fixture can make this guard fire (e.g. a guard over a hasMany length, or
  // an opaque comparison) — emit a todo rather than a guaranteed-red test.
  if (!assignment) {
    lines.push(
      `  it.todo('${ruleId}: ${escapedBody} → ${rule.effect} (no auto-derivable fixture)');`,
    );

    return;
  }

  lines.push(`  it('${ruleId}: ${escapedBody} → ${rule.effect}', () => {`);
  lines.push(`    const ctx = {`);
  lines.push(`      ${onKey}: ${emitModelLiteral(onModel, assignment[onKey] ?? {})},`);

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = requiresModels[key];

    if (rel.kind === "hasMany") {
      const defaults = model ? buildModelDefaults(model) : {};

      lines.push(`      ${key}: [${emitModelLiteral(model, defaults)}],`);
    } else {
      lines.push(`      ${key}: ${emitModelLiteral(model, assignment[key] ?? {})},`);
    }
  }

  lines.push(`    };`);
  lines.push(`    const result = ${validateFn}(ctx);`);

  if (rule.effect === "prevent") {
    lines.push(`    expect(result.valid).toBe(false);`);
    lines.push(`    expect(result.violations).toContain('${ruleId}');`);
  } else {
    lines.push(`    expect(result.warnings).toContain('${ruleId}');`);
  }

  lines.push(`  });`);
}

function emitTestImports(
  lines: string[],
  targetKey: string,
  policies: PolicyDef[],
): void {
  lines.push(`import { describe, it, expect } from 'vitest';`);

  const validatorImports = policies
    .map((p) => `validate${capitalize(p.name)}`)
    .join(", ");

  lines.push(`import { ${validatorImports} } from './${targetKey}.policies.js';`);

  const contextImports = policies
    .map((p) => `${capitalize(p.name)}Context`)
    .join(", ");

  lines.push(`import type { ${contextImports} } from './${targetKey}.policies.js';`);

  lines.push("");
}

/** Numeric literals in a guard body, each paired with value+1 (covers `>` vs `>=`). */
function extractNumberLiterals(body: string): number[] {
  const out: number[] = [];

  for (const match of body.matchAll(/-?\b\d+(?:\.\d+)?\b/g)) {
    const n = Number(match[0]);

    if (!Number.isNaN(n)) out.push(n, n + 1);
  }

  return dedupe(out);
}

/** Quoted string literals in a guard body. */
function extractStringLiterals(body: string): string[] {
  const out: string[] = [];

  for (const match of body.matchAll(/'([^']*)'|"([^"]*)"/g)) {
    out.push(match[1] ?? match[2] ?? "");
  }

  return dedupe(out);
}

/**
 * Search for a context that makes a policy rule's guard return true.
 *
 * Builds candidate values per prop — enum/lifecycle use their declared values,
 * boolean tries true/false, and number/string seed from literals found in the
 * guard body (`taskCount >= 8` → tries 8 and 9; `status === 'x'` → tries 'x').
 * Then probes the guard across the cartesian product of all probeable props on
 * the target model plus every `belongsTo` required model, returning the first
 * assignment that fires. Candidates are default-first and the search walks the
 * target model as the slowest-varying digit, so an all-defaults context (apart
 * from the one prop a guard pins) is found first — keeping output minimal.
 *
 * Limitations:
 * - hasMany required models are filled with a single default element, so guards
 *   over collection length/contents are not probed (falls through to it.todo).
 * - Guards comparing against runtime-only values (Date math, computed numbers
 *   not present as literals) may not be satisfiable here.
 */
function findSatisfyingAssignment(
  rule: PolicyRule,
  rawBody: string,
  onKey: string,
  onModel: ModelDef | undefined,
  policy: PolicyDef,
  requiresModels: Record<string, ModelDef>,
): null | Record<string, Record<string, unknown>> {
  const ctxModels = ctxModelsFor(onKey, onModel, policy, requiresModels);
  const slots = buildSlots(rawBody, ctxModels);

  const total = slots.reduce((n, slot) => n * slot.candidates.length, 1);

  if (total > MAX_COMBINATIONS) return null;

  const indices = new Array<number>(slots.length).fill(0);

  for (let iter = 0; iter < total; iter++) {
    if (guardFires(rule, buildProbeCtx(ctxModels, slots, indices))) {
      return collectAssignment(ctxModels, slots, indices);
    }

    // Odometer: increment the last slot fastest so the target model (first
    // slots) stays at defaults until the requires are exhausted.
    if (!advance(indices, slots)) break;
  }

  return null;
}

function guardFires(rule: PolicyRule, ctx: Record<string, unknown>): boolean {
  try {
    return (rule.when as (c: unknown) => unknown)(ctx) === true;
  } catch {
    // Guard may touch props/shapes not present in this probe — not firing.
    return false;
  }
}

function isDefaultValue(
  prop: PropDef,
  value: unknown,
  defaultValue: unknown,
): boolean {
  if (prop.kind === "date") {
    return (
      value instanceof Date &&
      defaultValue instanceof Date &&
      value.getTime() === defaultValue.getTime()
    );
  }

  return value === defaultValue;
}

function resolveRequiresModels(
  policy: PolicyDef,
  modelLookup: Map<string, ModelDef>,
): Record<string, ModelDef> {
  const result: Record<string, ModelDef> = {};

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = modelLookup.get(rel.target.name);

    if (model) result[key] = model;
  }

  return result;
}
