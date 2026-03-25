import type { ModelDef } from "../schema/model.js";

import { capitalize, getTransitions } from "./utils.js";

/** Generate E2E test stubs with TODOs from a model's transitions. */
export const generateE2EStubs = (model: ModelDef): string => {
  const transitions = getTransitions(model);

  if (transitions.length === 0) return "";

  const typeName = capitalize(model.name);
  const lines: string[] = [];

  lines.push(`import { test } from 'vitest';`);
  lines.push("");

  for (const [name, transition] of transitions) {
    lines.push(
      `test('${typeName}: ${name} flow (${transition.from} → ${transition.to})', async () => {`,
    );
    lines.push(
      `  // TODO: setup — create ${typeName} in '${transition.from}' state`,
    );
    lines.push(`  // TODO: act — trigger ${name}`);
    lines.push(`  // TODO: assert — verify state is '${transition.to}'`);
    lines.push(`});`);
    lines.push("");
  }

  return lines.join("\n");
};
