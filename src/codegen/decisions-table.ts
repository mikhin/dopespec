import type { DecisionDef } from "../schema/decisions.js";

export const generateDecisionTable = (def: DecisionDef): string => {
  const inputKeys = Object.keys(def.inputs);
  const outputKeys = Object.keys(def.outputs);
  const lines: string[] = [];

  lines.push(`# ${def.name}`);
  lines.push("");

  // Header row
  const headers = [...inputKeys, ...outputKeys.map((k) => `\u2192 ${k}`)];

  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

  // Data rows
  for (const rule of def.rules) {
    const when = rule.when as Record<string, unknown>;
    const then = rule.then as Record<string, unknown>;

    const cells: string[] = [];

    for (const key of inputKeys) {
      cells.push(key in when ? String(when[key]) : "*");
    }

    for (const key of outputKeys) {
      cells.push(String(then[key]));
    }

    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");

  return lines.join("\n");
};
