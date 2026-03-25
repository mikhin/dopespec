import type { ModelDef } from "../schema/model.js";

import { capitalize, fieldsToTSType, getActions } from "./utils.js";

/** Generate service orchestrator skeletons from a model's actions. */
export const generateOrchestrators = (model: ModelDef): string => {
  const actions = getActions(model);

  if (actions.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const propsType = `${typeName}Props`;
  const lines: string[] = [];

  // Convention: generated orchestrators module imports types from ./${modelName}.types
  lines.push(`import type { ${propsType} } from './${modelName}.types.js';`);
  lines.push("");

  for (const [name, actionDef] of actions) {
    const fnName = `handle${typeName}${capitalize(name)}`;
    const payloadType = fieldsToTSType(actionDef.fields);

    lines.push(
      `export function ${fnName}(ctx: ${propsType}, payload: ${payloadType}): ${propsType} {`,
    );
    lines.push(`  // TODO: implement ${name}`);
    lines.push(`  return ctx;`);
    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
};
