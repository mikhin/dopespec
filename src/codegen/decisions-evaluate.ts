import type { DecisionDef } from "../schema/decisions.js";

import { capitalize, propKindToTS, valueToSource } from "./utils.js";

export const generateDecisionEvaluate = (def: DecisionDef): string => {
  const name = capitalize(def.name);
  const lines: string[] = [];

  // Input type
  lines.push(`export type ${name}Input = {`);

  for (const [key, prop] of Object.entries(def.inputs)) {
    lines.push(`  ${key}: ${propKindToTS(prop)};`);
  }

  lines.push(`};`);
  lines.push("");

  // Output type
  lines.push(`export type ${name}Output = {`);

  for (const [key, prop] of Object.entries(def.outputs)) {
    lines.push(`  ${key}: ${propKindToTS(prop)};`);
  }

  lines.push(`};`);
  lines.push("");

  // Evaluate function — rules are evaluated top-to-bottom, first match wins
  lines.push(`/** Evaluate rules top-to-bottom, return first match. */`);
  lines.push(
    `export function evaluate${name}(input: ${name}Input): ${name}Output {`,
  );

  for (const rule of def.rules) {
    const when = rule.when as Record<string, unknown>;
    const then = rule.then as Record<string, unknown>;

    const conditions = Object.entries(when)
      .map(([key, val]) => `input.${key} === ${valueToSource(val)}`)
      .join(" && ");

    const output = Object.entries(then)
      .map(([key, val]) => `${key}: ${valueToSource(val)}`)
      .join(", ");

    if (conditions) {
      lines.push(`  if (${conditions}) return { ${output} };`);
    } else {
      lines.push(`  return { ${output} };`);
    }
  }

  lines.push(`  throw new Error('No matching rule for ${name}');`);
  lines.push(`}`);
  lines.push("");

  return lines.join("\n");
};
