import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";

import { capitalize, guardToSource, resolvePolicyGuardBody } from "./utils.js";

/**
 * Generate policy validator functions for all policies targeting a single model.
 * Output: generated/${targetModel}.policies.ts
 */
export const generatePolicyValidator = (
  policies: PolicyDef[],
  modelLookup: Map<string, ModelDef>,
): string => {
  if (policies.length === 0) return "";

  const lines: string[] = [];

  // Collect and emit imports
  emitImports(lines, policies);

  // Generate per-policy context types and validator functions
  for (const policy of policies) {
    emitPolicyValidator(lines, policy, modelLookup);
  }

  return lines.join("\n");
};

function emitImports(lines: string[], policies: PolicyDef[]): void {
  const imports = new Map<string, string>();

  for (const policy of policies) {
    const onModelName = policy.on.model.name;

    imports.set(onModelName.toLowerCase(), `${capitalize(onModelName)}Props`);

    for (const rel of Object.values(policy.requires)) {
      const reqModelName = rel.target.name;

      imports.set(
        reqModelName.toLowerCase(),
        `${capitalize(reqModelName)}Props`,
      );
    }
  }

  for (const [modelKey, propsType] of [...imports].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    lines.push(`import type { ${propsType} } from './${modelKey}.types.js';`);
  }

  lines.push("");
}

function emitPolicyValidator(
  lines: string[],
  policy: PolicyDef,
  modelLookup: Map<string, ModelDef>,
): void {
  const policyName = capitalize(policy.name);
  const onModelTypeName = capitalize(policy.on.model.name);
  const contextTypeName = `${policyName}Context`;

  // Context type
  lines.push(`export type ${contextTypeName} = {`);
  lines.push(
    `  ${policy.on.model.name.toLowerCase()}: ${onModelTypeName}Props;`,
  );

  for (const [key, rel] of Object.entries(policy.requires)) {
    const reqTypeName = `${capitalize(rel.target.name)}Props`;
    const suffix = rel.kind === "hasMany" ? "[]" : "";

    lines.push(`  ${key}: ${reqTypeName}${suffix};`);
  }

  lines.push(`};`);
  lines.push("");

  // Resolve required models for guard body resolution
  const requiresModels: Record<string, ModelDef> = {};

  for (const [key, rel] of Object.entries(policy.requires)) {
    const model = modelLookup.get(rel.target.name);

    if (model) requiresModels[key] = model;
  }

  // Validator function
  lines.push(
    `export function validate${policyName}(ctx: ${contextTypeName}): { valid: boolean; violations: string[]; warnings: string[] } {`,
  );
  lines.push(`  const violations: string[] = [];`);
  lines.push(`  const warnings: string[] = [];`);

  for (const [i, rule] of policy.rules.entries()) {
    const rawBody = guardToSource(
      rule.when as (ctx: Record<string, unknown>) => unknown,
    );
    const guardBody = resolvePolicyGuardBody(
      rule.when,
      rawBody,
      requiresModels,
    );
    const target = rule.effect === "prevent" ? "violations" : "warnings";
    const ruleId = `${policy.name}:rule_${String(i)}`;

    lines.push(`  if (${guardBody}) ${target}.push('${ruleId}');`);
  }

  lines.push(
    `  return { valid: violations.length === 0, violations, warnings };`,
  );
  lines.push(`}`);
  lines.push("");
}
