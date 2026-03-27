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
} from "./utils.js";

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
  const targetKey = targetModelName.toLowerCase();

  emitTestImports(lines, targetKey, policies);

  for (const policy of policies) {
    emitPolicyTestBlock(lines, policy, modelLookup);
  }

  return lines.join("\n");
};

/** Build a source-code object literal with default values for a model's props. */
function buildCtxSource(model: ModelDef | undefined): string {
  if (!model?.props) return "{}";

  const entries = buildPropDefaults(model);

  return `{ ${entries.join(", ")} }`;
}

function buildOverriddenCtx(
  model: ModelDef,
  overrideProp: string,
  overrideValue: string,
): string {
  const entries: string[] = [];

  if (model.props) {
    for (const [k, p] of Object.entries(model.props).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      entries.push(
        k === overrideProp
          ? `${k}: '${overrideValue}'`
          : `${k}: ${defaultValueForProp(p)}`,
      );
    }
  }

  if (model.relations) {
    for (const [k, rel] of Object.entries(model.relations).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const field = relationIdField(k, rel.kind);

      entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
    }
  }

  return `{ ${entries.join(", ")} }`;
}

function buildPropDefaults(model: ModelDef): string[] {
  const entries: string[] = [];

  if (model.props) {
    for (const [key, prop] of Object.entries(model.props).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      entries.push(`${key}: ${defaultValueForProp(prop)}`);
    }
  }

  if (model.relations) {
    for (const [key, rel] of Object.entries(model.relations).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const field = relationIdField(key, rel.kind);

      entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
    }
  }

  return entries;
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
    emitRuleTest(
      lines,
      i,
      rule,
      policy,
      validateFn,
      requiresModels,
      modelLookup,
    );
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
  // Guard body in test description for readability; stable ID in assertion
  const escapedBody = guardBody.replace(/'/g, "\\'");

  lines.push(`  it('${ruleId}: ${escapedBody} → ${rule.effect}', () => {`);

  // Build context
  lines.push(`    const ctx = {`);

  const onModel = modelLookup.get(policy.on.model.name);

  lines.push(
    `      ${policy.on.model.name.toLowerCase()}: ${buildCtxSource(onModel)},`,
  );

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = requiresModels[key];

    if (rel.kind === "hasMany") {
      lines.push(`      ${key}: [${buildCtxSource(model)}],`);
    } else {
      lines.push(`      ${key}: ${findTriggerValues(rule.when, key, model)},`);
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

  lines.push(
    `import { ${validatorImports} } from './${targetKey}.policies.js';`,
  );

  const contextImports = policies
    .map((p) => `${capitalize(p.name)}Context`)
    .join(", ");

  lines.push(
    `import type { ${contextImports} } from './${targetKey}.policies.js';`,
  );

  lines.push("");
}

function findTriggerEntry(
  guard: PolicyRule["when"],
  reqKey: string,
  model: ModelDef,
  defaults: Record<string, unknown>,
): undefined | { propName: string; value: string } {
  if (!model.props) return undefined;

  for (const [propName, prop] of Object.entries(model.props)) {
    const probeValues = probeValuesForProp(prop);

    for (const value of probeValues) {
      try {
        const ctx = { [reqKey]: { ...defaults, [propName]: value } };

        if (guard(ctx) === true) return { propName, value: String(value) };
      } catch {
        /* guard may access props not yet available */
      }
    }
  }

  return undefined;
}

/**
 * Find prop values that trigger a policy rule's guard for a specific requires key.
 * Probes the guard with different enum/boolean values to find which one returns true.
 *
 * Limitation: probes one requires key at a time. Guards that check multiple keys
 * (e.g. ctx.customer.status === 'x' && ctx.orders.length > 5) may not trigger
 * during single-key probing — falls back to default values in that case.
 */
function findTriggerValues(
  guard: PolicyRule["when"],
  reqKey: string,
  model: ModelDef | undefined,
): string {
  if (!model?.props) return "{}";

  const defaults = buildModelDefaults(model);
  const triggerEntry = findTriggerEntry(guard, reqKey, model, defaults);

  if (!triggerEntry) return buildCtxSource(model);

  return buildOverriddenCtx(model, triggerEntry.propName, triggerEntry.value);
}

/**
 * Probe values for a prop kind. Lifecycle/oneOf use their declared values,
 * boolean tries true/false, other kinds are not probed.
 */
function probeValuesForProp(prop: PropDef): readonly unknown[] {
  if (prop.kind === "lifecycle" || prop.kind === "oneOf")
    return prop.values as readonly string[];
  if (prop.kind === "boolean") return [true, false];

  return [];
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
