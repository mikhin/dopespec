import type { ModelDef } from "../schema/model.js";
import type { Scenario, TransitionData } from "../schema/transitions.js";

import {
  capitalize,
  getLifecycleProp,
  getRelations,
  getTransitions,
  relationIdField,
} from "./utils.js";

const formatCtxSetup = (
  givenStr: string,
  lifecycleKey: string | undefined,
  fromState: string,
  relationDefaults: string,
): string => {
  const stateAssign = lifecycleKey ? `, ${lifecycleKey}: '${fromState}'` : "";

  return `    const ctx = { ...${givenStr}${stateAssign}${relationDefaults} };`;
};

const formatSuccessCase = (
  name: string,
  typeName: string,
  givenStr: string,
  expectedState: string,
  lifecycleKey: string | undefined,
  fromState: string,
  relationDefaults: string,
): string[] => {
  const fnName = `${typeName}${capitalize(name)}`;
  const lines = [
    `  it('given ${givenStr}, when ${name}, then ${lifecycleKey ?? "transition"} = ${expectedState}', () => {`,
    formatCtxSetup(givenStr, lifecycleKey, fromState, relationDefaults),
    `    const result = ${fnName}(ctx);`,
  ];

  if (lifecycleKey) {
    lines.push(`    expect(result.${lifecycleKey}).toBe('${expectedState}');`);
  } else {
    lines.push(`    expect(result).toBeDefined();`);
  }

  lines.push(`  });`);

  return lines;
};

const formatFailureCase = (
  name: string,
  typeName: string,
  givenStr: string,
  expectedState: string,
  lifecycleKey: string | undefined,
  fromState: string,
  relationDefaults: string,
): string[] => {
  const fnName = `${typeName}${capitalize(name)}`;

  return [
    `  it('given ${givenStr}, when ${name}, then stays ${expectedState}', () => {`,
    formatCtxSetup(givenStr, lifecycleKey, fromState, relationDefaults),
    `    expect(() => ${fnName}(ctx)).toThrow();`,
    `  });`,
  ];
};

const formatScenario = (
  name: string,
  typeName: string,
  scenario: Scenario,
  transition: TransitionData,
  lifecycleKey: string | undefined,
  relationDefaults: string,
): string[] => {
  const givenStr = JSON.stringify(scenario.given);
  const succeeds = scenario.expected === transition.to;

  return succeeds
    ? formatSuccessCase(
        name,
        typeName,
        givenStr,
        scenario.expected,
        lifecycleKey,
        transition.from,
        relationDefaults,
      )
    : formatFailureCase(
        name,
        typeName,
        givenStr,
        scenario.expected,
        lifecycleKey,
        transition.from,
        relationDefaults,
      );
};

/** Generate unit tests from transition scenarios in Given/When/Then style. */
export const generateTests = (model: ModelDef): string => {
  const transitions = getTransitions(model);

  if (transitions.length === 0) return "";

  const typeName = capitalize(model.name);
  const modelName = model.name.toLowerCase();
  const lifecycleKey = getLifecycleProp(model)?.key;

  // Build default values for relation fields in ctx setup
  const relations = getRelations(model);
  const relationParts: string[] = [];

  for (const [key, rel] of relations) {
    const fieldName = relationIdField(key, rel.kind);
    const defaultValue = rel.kind === "belongsTo" ? "''" : "[]";

    relationParts.push(`${fieldName}: ${defaultValue}`);
  }

  const relationSuffix = relationParts.join(", ");
  const relationDefaults =
    relationParts.length > 0
      ? `, ${relationSuffix} /* TODO: replace with real test data */`
      : "";

  // Collect transition function names that have scenarios
  const transitionFnNames: string[] = [];

  for (const [name, transition] of transitions) {
    if (transition.scenarios && transition.scenarios.length > 0) {
      transitionFnNames.push(`${typeName}${capitalize(name)}`);
    }
  }

  if (transitionFnNames.length === 0) return "";

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  // Convention: generated transition module lives at ./${modelName}.transitions.js
  lines.push(
    `import { ${transitionFnNames.join(", ")} } from './${modelName}.transitions.js';`,
  );
  lines.push("");
  lines.push(`describe('${typeName}', () => {`);

  for (const [name, transition] of transitions) {
    if (!transition.scenarios || transition.scenarios.length === 0) continue;

    for (const scenario of transition.scenarios) {
      lines.push(
        ...formatScenario(
          name,
          typeName,
          scenario,
          transition,
          lifecycleKey,
          relationDefaults,
        ),
      );
      lines.push("");
    }
  }

  lines.push(`});`);
  lines.push("");

  return lines.join("\n");
};
