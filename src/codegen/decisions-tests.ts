import type { DecisionDef } from "../schema/decisions.js";

import {
  capitalize,
  defaultValueForProp,
  toKebabCase,
  valueToSource,
} from "./utils.js";

export const generateDecisionTests = (def: DecisionDef): string => {
  const name = capitalize(def.name);
  const lower = toKebabCase(def.name);
  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push(`import { evaluate${name} } from './${lower}.evaluate.js';`);
  lines.push("");
  lines.push(`describe('${name}', () => {`);

  for (const rule of def.rules) {
    const when = rule.when as Record<string, unknown>;
    const then = rule.then as Record<string, unknown>;

    const whenDesc = Object.entries(when)
      .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
      .join(", ");
    const thenDesc = Object.entries(then)
      .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
      .join(", ");

    const whenLabel = whenDesc || "default (no conditions)";

    lines.push(`  it('when ${whenLabel}, then ${thenDesc}', () => {`);

    // Build input — use when values for specified keys, defaults for rest
    const inputParts: string[] = [];

    for (const [key, prop] of Object.entries(def.inputs)) {
      if (key in when) {
        inputParts.push(`${key}: ${valueToSource(when[key])}`);
      } else {
        inputParts.push(`${key}: ${defaultValueForProp(prop)}`);
      }
    }

    lines.push(
      `    const result = evaluate${name}({ ${inputParts.join(", ")} });`,
    );

    const expectedParts = Object.entries(then)
      .map(([key, val]) => `${key}: ${valueToSource(val)}`)
      .join(", ");

    lines.push(`    expect(result).toEqual({ ${expectedParts} });`);
    lines.push(`  });`);
    lines.push("");
  }

  lines.push(`});`);
  lines.push("");

  return lines.join("\n");
};
