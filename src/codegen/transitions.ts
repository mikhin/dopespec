import type { ModelDef } from "../schema/model.js";

import {
  capitalize,
  getLifecycleProp,
  getTransitions,
  guardToSource,
} from "./utils.js";

/** Generate transition functions with runtime state checks and guards. */
export const generateTransitions = (model: ModelDef): string => {
  const transitions = getTransitions(model);

  if (transitions.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const propsType = `${typeName}Props`;
  const lines: string[] = [];

  // Convention: generated transition module imports types from ./${modelName}.types
  lines.push(`import type { ${propsType} } from './${modelName}.types.js';`);
  lines.push("");

  const lifecycleKey = getLifecycleProp(model)?.key;

  for (const [name, transition] of transitions) {
    const fnName = `${typeName}${capitalize(name)}`;

    lines.push(`export function ${fnName}(ctx: ${propsType}): ${propsType} {`);

    if (lifecycleKey) {
      lines.push(`  if (ctx.${lifecycleKey} !== '${transition.from}') {`);
      lines.push(
        `    throw new Error(\`Cannot ${name}: expected ${lifecycleKey} '${transition.from}', got '\${ctx.${lifecycleKey}}'\`);`,
      );
      lines.push(`  }`);
    }

    if (transition.guard) {
      const guardBody = guardToSource(transition.guard);

      lines.push(`  if (!(${guardBody})) {`);
      lines.push(`    throw new Error('Guard failed for transition ${name}');`);
      lines.push(`  }`);
    }

    if (lifecycleKey) {
      lines.push(`  return { ...ctx, ${lifecycleKey}: '${transition.to}' };`);
    } else {
      lines.push(`  return ctx;`);
    }

    lines.push(`}`);
    lines.push("");
  }

  return lines.join("\n");
};
