import type { ModelDef } from "../schema/model.js";

import { capitalize, getTransitions } from "./utils.js";

/**
 * Generate domain event types from a model's transitions.
 * Generated code references ${Model}Props — expects types from ./${modelName}.types
 * to be available (either concatenated or imported).
 */
export const generateEvents = (model: ModelDef): string => {
  const transitions = getTransitions(model);

  if (transitions.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const propsType = `${typeName}Props`;
  const lines: string[] = [];
  const eventTypeNames: string[] = [];

  // Convention: generated events file expects types from ./${modelName}.types
  lines.push(`import type { ${propsType} } from './${modelName}.types.js';`);
  lines.push("");

  for (const [name, transition] of transitions) {
    const eventName = `${typeName}${capitalize(name)}Event`;

    eventTypeNames.push(eventName);

    lines.push(`export type ${eventName} = {`);
    lines.push(`  type: '${typeName}${capitalize(name)}';`);
    lines.push(`  payload: ${propsType};`);
    lines.push(`  from: '${transition.from}';`);
    lines.push(`  to: '${transition.to}';`);
    lines.push(`  timestamp: Date;`);
    lines.push(`};`);
    lines.push("");
  }

  // Union type
  lines.push(`export type ${typeName}Event = ${eventTypeNames.join(" | ")};`);
  lines.push("");

  return lines.join("\n");
};
