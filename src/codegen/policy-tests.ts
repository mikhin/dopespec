import type { ModelDef } from "../schema/model.js";
import type { PolicyDef, PolicyRule } from "../schema/policy.js";
import type { PropDef } from "../schema/props.js";

import {
  buildModelDefaults,
  capitalize,
  defaultValueForProp,
  getRelations,
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

  const targetKey = toKebabCase(targetModelName);

  // Emit the test blocks first, tracking which policies produced at least one
  // REAL test (auto-found fixture or a rule `example`). Imports are then emitted
  // only for those — a file of pure `it.todo`s needs neither the validators nor
  // `expect`, so this keeps the output lint-clean.
  const bodyLines: string[] = [];
  const policiesWithRealTest: PolicyDef[] = [];

  for (const policy of policies) {
    const hadRealTest = emitPolicyTestBlock(bodyLines, policy, modelLookup);

    if (hadRealTest) policiesWithRealTest.push(policy);
  }

  const headerLines: string[] = [];

  emitTestImports(headerLines, targetKey, policiesWithRealTest);

  return [...headerLines, ...bodyLines].join("\n");
};

type CtxModel = {
  key: string;
  kind: "array" | "object";
  model: ModelDef | undefined;
};

type SearchResult =
  | { assignment: Record<string, Record<string, unknown>>; kind: "found" }
  | { kind: "capped"; total: number }
  | { kind: "exhausted" };

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

/** Candidate values to probe for a prop — always non-empty and default-first. */
function candidatesForProp(
  prop: PropDef,
  defaultValue: unknown,
  numberLiterals: readonly number[],
  stringLiterals: readonly string[],
): readonly unknown[] {
  // Prepend the default so the list is never empty — an enum can be declared
  // with an empty values tuple, and an empty candidate list would zero out the
  // whole search space — and so the all-defaults context is probed first.
  return dedupe([
    defaultValue,
    ...seedCandidates(prop, numberLiterals, stringLiterals),
  ]);
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

/** The shared `const result = …; expect(…)` tail for a real policy test. */
function emitAssertionTail(
  lines: string[],
  validateFn: string,
  rule: PolicyRule,
  ruleId: string,
): void {
  lines.push(`    const result = ${validateFn}(ctx);`);

  if (rule.effect === "prevent") {
    lines.push(`    expect(result.valid).toBe(false);`);
    lines.push(`    expect(result.violations).toContain('${ruleId}');`);
  } else {
    lines.push(`    expect(result.warnings).toContain('${ruleId}');`);
  }
}

/**
 * Build the ctx literal for a rule `example`. The example may be PARTIAL — only the
 * fields the guard reads — so each ctx key is merged over its model's defaults (see
 * emitMergedModelLiteral) to produce a type-complete literal.
 */
function emitExampleCtx(
  example: Record<string, unknown>,
  onKey: string,
  onModel: ModelDef | undefined,
  policy: PolicyDef,
  requiresModels: Record<string, ModelDef>,
  modelLookup: Map<string, ModelDef>,
): string {
  const parts: string[] = [
    `${onKey}: ${emitMergedModelLiteral(onModel, example[onKey], modelLookup)}`,
  ];

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = requiresModels[key];
    const value = example[key];

    if (rel.kind === "hasMany") {
      const arr = Array.isArray(value) ? value : [];
      const elems = arr.map((el) =>
        emitMergedModelLiteral(model, el, modelLookup),
      );

      parts.push(`${key}: [${elems.join(", ")}]`);
    } else {
      parts.push(`${key}: ${emitMergedModelLiteral(model, value, modelLookup)}`);
    }
  }

  return `{ ${parts.join(", ")} }`;
}

/**
 * Emit a full model literal by merging a (possibly partial) example value over the
 * model's props/relations. Author-supplied fields win; omitted ones fall back to
 * defaults, and embedded child collections recurse. This lets a rule `example` name
 * only the guard-relevant fields yet still produce a type-complete literal.
 */
function emitMergedModelLiteral(
  model: ModelDef | undefined,
  partial: unknown,
  modelLookup: Map<string, ModelDef>,
): string {
  if (!model?.props) {
    return partial === undefined ? "{}" : valueToSource(partial);
  }

  const provided =
    partial && typeof partial === "object" && !Array.isArray(partial)
      ? (partial as Record<string, unknown>)
      : {};

  const entries = [
    ...emitMergedProps(model, provided),
    ...emitMergedRelations(model, provided, modelLookup),
  ];

  return `{ ${entries.join(", ")} }`;
}

/** Prop entries for a merged literal: author value if present, else the default. */
function emitMergedProps(
  model: ModelDef,
  provided: Record<string, unknown>,
): string[] {
  return Object.entries(model.props ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, prop]) =>
        `${key}: ${key in provided ? valueToSource(provided[key]) : defaultValueForProp(prop)}`,
    );
}

/** Relation entries for a merged literal: embeds recurse, id fields default. */
function emitMergedRelations(
  model: ModelDef,
  provided: Record<string, unknown>,
  modelLookup: Map<string, ModelDef>,
): string[] {
  return getRelations(model)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rel]) => {
      if (rel.kind === "embeds") {
        const childModel = modelLookup.get(rel.target.name);
        const arr = Array.isArray(provided[key])
          ? (provided[key] as unknown[])
          : [];
        const elems = arr.map((el) =>
          emitMergedModelLiteral(childModel, el, modelLookup),
        );

        return `${key}: [${elems.join(", ")}]`;
      }

      const field = relationIdField(key, rel.kind);

      if (field in provided)
        return `${field}: ${valueToSource(provided[field])}`;

      return rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`;
    });
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
      if (rel.kind === "embeds") {
        entries.push(`${key}: []`);
        continue;
      }

      const field = relationIdField(key, rel.kind);

      entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
    }
  }

  return `{ ${entries.join(", ")} }`;
}

/** Returns true when at least one rule produced a real (non-todo) test. */
function emitPolicyTestBlock(
  lines: string[],
  policy: PolicyDef,
  modelLookup: Map<string, ModelDef>,
): boolean {
  const policyName = capitalize(policy.name);
  const validateFn = `validate${policyName}`;
  const requiresModels = resolveRequiresModels(policy, modelLookup);

  lines.push(`describe('${policy.name}', () => {`);

  let anyReal = false;

  for (const [i, rule] of policy.rules.entries()) {
    if (i > 0) lines.push("");
    const isReal = emitRuleTest(
      lines,
      i,
      rule,
      policy,
      validateFn,
      requiresModels,
      modelLookup,
    );

    anyReal = anyReal || isReal;
  }

  lines.push(`});`);
  lines.push("");

  return anyReal;
}

/** Returns true when a real (non-todo) test was emitted for this rule. */
function emitRuleTest(
  lines: string[],
  index: number,
  rule: PolicyRule,
  policy: PolicyDef,
  validateFn: string,
  requiresModels: Record<string, ModelDef>,
  modelLookup: Map<string, ModelDef>,
): boolean {
  const rawBody = guardToSource(
    rule.when as (ctx: Record<string, unknown>) => unknown,
  );
  const guardBody = resolvePolicyGuardBody(rule.when, rawBody, requiresModels);
  const ruleId = `${policy.name}:rule_${String(index)}`;
  // Guard body in test description for readability; stable ID in assertion.
  const escapedBody = guardBody.replace(/'/g, "\\'");
  const title = `${ruleId}: ${escapedBody} → ${rule.effect}`;

  const onModel = modelLookup.get(policy.on.model.name);
  const onKey = policy.on.model.name.toLowerCase();
  const search = findSatisfyingAssignment(
    rule,
    rawBody,
    onKey,
    onModel,
    policy,
    requiresModels,
  );

  if (search.kind !== "found") {
    // An author-provided example rescues guards the auto-search can't satisfy
    // (e.g. a guard over embedded-collection length). It was already validated
    // to fire the guard at definition time, so emit a real test from it.
    if (rule.example) {
      lines.push(`  it('${title}', () => {`);
      lines.push(
        `    const ctx: ${capitalize(policy.name)}Context = ${emitExampleCtx(rule.example, onKey, onModel, policy, requiresModels, modelLookup)};`,
      );
      emitAssertionTail(lines, validateFn, rule, ruleId);
      lines.push(`  });`);

      return true;
    }

    // No fixture — emit a todo rather than a guaranteed-red test, and say why:
    // genuinely unsatisfiable (e.g. a hasMany-length guard, add an `example`) vs.
    // a search space larger than the cap (which may yet be satisfiable).
    const reason =
      search.kind === "capped"
        ? `search space ${String(search.total)} exceeds cap of ${String(MAX_COMBINATIONS)}`
        : "no fixture satisfies the guard — add an `example` to the rule";

    lines.push(`  it.todo('${title} (${reason})');`);

    return false;
  }

  const assignment = search.assignment;

  lines.push(`  it('${title}', () => {`);
  lines.push(`    const ctx: ${capitalize(policy.name)}Context = {`);
  lines.push(
    `      ${onKey}: ${emitModelLiteral(onModel, assignment[onKey] ?? {})},`,
  );

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = requiresModels[key];

    if (rel.kind === "hasMany") {
      const defaults = model ? buildModelDefaults(model) : {};

      lines.push(`      ${key}: [${emitModelLiteral(model, defaults)}],`);
    } else {
      lines.push(
        `      ${key}: ${emitModelLiteral(model, assignment[key] ?? {})},`,
      );
    }
  }

  lines.push(`    };`);
  emitAssertionTail(lines, validateFn, rule, ruleId);
  lines.push(`  });`);

  return true;
}

/**
 * `policiesWithRealTest` are those that emitted at least one non-todo test. Only
 * they need `expect` and the validator / Context imports — a file of pure todos
 * imports just `describe, it`, so nothing dangles (keeps the output lint-clean).
 */
function emitTestImports(
  lines: string[],
  targetKey: string,
  policiesWithRealTest: PolicyDef[],
): void {
  if (policiesWithRealTest.length === 0) {
    lines.push(`import { describe, it } from 'vitest';`);
    lines.push("");

    return;
  }

  lines.push(`import { describe, it, expect } from 'vitest';`);

  const validatorImports = policiesWithRealTest
    .map((p) => `validate${capitalize(p.name)}`)
    .join(", ");

  lines.push(
    `import { ${validatorImports} } from './${targetKey}.policies.js';`,
  );

  const contextImports = policiesWithRealTest
    .map((p) => `${capitalize(p.name)}Context`)
    .join(", ");

  lines.push(
    `import type { ${contextImports} } from './${targetKey}.policies.js';`,
  );

  lines.push("");
}

/**
 * Numeric literals in a guard body (incl. decimals and scientific notation),
 * each seeded with value-1 and value+1 so the search straddles a threshold
 * regardless of the operator (`>`/`>=`/`<`/`<=`).
 */
function extractNumberLiterals(body: string): number[] {
  const out: number[] = [];

  for (const match of body.matchAll(/-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g)) {
    const n = Number(match[0]);

    if (!Number.isNaN(n)) out.push(n - 1, n, n + 1);
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
): SearchResult {
  const ctxModels = ctxModelsFor(onKey, onModel, policy, requiresModels);
  const slots = buildSlots(rawBody, ctxModels);

  const total = slots.reduce((n, slot) => n * slot.candidates.length, 1);

  // Distinct from "exhausted": the space may hold a satisfying assignment we
  // chose not to enumerate, so the caller words its it.todo differently.
  if (total > MAX_COMBINATIONS) return { kind: "capped", total };

  const indices = new Array<number>(slots.length).fill(0);

  for (let iter = 0; iter < total; iter++) {
    if (guardFires(rule, buildProbeCtx(ctxModels, slots, indices))) {
      return {
        assignment: collectAssignment(ctxModels, slots, indices),
        kind: "found",
      };
    }

    // Odometer: increment the last slot fastest so the target model (first
    // slots) stays at defaults until the requires are exhausted.
    if (!advance(indices, slots)) break;
  }

  return { kind: "exhausted" };
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

/** Extra probe values per prop kind (the default is prepended separately). */
function seedCandidates(
  prop: PropDef,
  numberLiterals: readonly number[],
  stringLiterals: readonly string[],
): readonly unknown[] {
  if (prop.kind === "lifecycle" || prop.kind === "oneOf") {
    return prop.values as readonly unknown[];
  }

  if (prop.kind === "boolean") return [true, false];

  if (prop.kind === "number") return numberLiterals;

  if (prop.kind === "string") return stringLiterals;

  // date and any future kind: not probed beyond the default.
  return [];
}
