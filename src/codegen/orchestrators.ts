import type { ModelDef } from "../schema/model.js";

import { capitalize, fieldsToTSType, getActions } from "./utils.js";

/**
 * Generate service orchestrator skeletons from a model's actions.
 * @param policyActions — optional map of action → policy names for TODO comments
 */
export const generateOrchestrators = (
  model: ModelDef,
  policyActions?: Map<string, string[]>,
): string => {
  const actions = getActions(model);

  if (actions.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const propsType = `${typeName}Props`;
  const lines: string[] = [];

  // User code in src/ imports types from ../generated/
  lines.push(
    `import type { ${propsType} } from '../generated/${modelName}.types.js';`,
  );
  lines.push("");

  for (const [name, actionDef] of actions) {
    const fnName = `handle${typeName}${capitalize(name)}`;
    const payloadType = fieldsToTSType(actionDef.fields);

    lines.push(
      `export function ${fnName}(ctx: ${propsType}, _payload: ${payloadType}): ${propsType} {`,
    );

    const policyNames = policyActions?.get(name);

    if (policyNames && policyNames.length > 0) {
      lines.push(`  // TODO: validate policies (${policyNames.join(", ")})`);
    }

    lines.push(`  // TODO: implement ${name}`);
    lines.push(`  return ctx;`);
    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
};
