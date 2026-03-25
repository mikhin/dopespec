import type { ModelDef } from "../schema/model.js";

import { capitalize, getConstraints, guardToSource } from "./utils.js";

/** Generate invariant validation functions from a model's constraints. */
export const generateInvariants = (model: ModelDef): string => {
  const constraints = getConstraints(model);

  if (constraints.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const propsType = `${typeName}Props`;
  const lines: string[] = [];
  const constraintNames: string[] = [];

  // Convention: generated invariants module imports types from ./${modelName}.types
  lines.push(`import type { ${propsType} } from './${modelName}.types.js';`);
  lines.push("");

  // Constraint semantics:
  //   rule().when(ctx => ctx.status === 'cancelled').prevent('addItem')
  //   guard returns TRUE  → constraint is VIOLATED (action is prevented)
  //   guard returns FALSE → constraint is SATISFIED (action is allowed)
  //
  // Invariant semantics (inverted):
  //   validate*() returns TRUE  → model is VALID (guard condition is NOT met)
  //   validate*() returns FALSE → model is INVALID (guard condition IS met)
  //
  // Therefore: invariant = !(guard)

  for (const [name, constraint] of constraints) {
    constraintNames.push(name);
    const fnName = `validate${capitalize(name)}`;

    lines.push(`export function ${fnName}(ctx: ${propsType}): boolean {`);

    if (constraint.guard) {
      const guardBody = guardToSource(constraint.guard);

      lines.push(`  // guard=true means violation, so invariant negates it`);
      lines.push(`  return !(${guardBody});`);
    } else {
      lines.push(`  return true;`);
    }

    lines.push(`}`);
    lines.push("");
  }

  // Combined validator
  lines.push(
    `export function validate${typeName}(ctx: ${propsType}): { valid: boolean; violations: string[] } {`,
  );
  lines.push(`  const violations: string[] = [];`);

  for (const name of constraintNames) {
    const fnName = `validate${capitalize(name)}`;

    lines.push(`  if (!${fnName}(ctx)) violations.push('${name}');`);
  }

  lines.push(`  return { valid: violations.length === 0, violations };`);
  lines.push(`}`);
  lines.push("");

  return lines.join("\n");
};
