import { isOptional } from "../schema/props.js";
import { capitalize, defaultValueForProp, getLifecycleProp, getRelations, getTransitions, relationIdField, valueToSource, } from "./utils.js";
/**
 * Build a complete ctx object literal by merging prop defaults, relation
 * defaults, and scenario-given values at codegen time. This avoids duplicate
 * keys (which strict tsc warns about) and uses `satisfies` to prevent
 * string-literal widening while still catching missing props.
 */
const buildCtxLiteral = (scenario, fromState, tg) => {
    const parts = [];
    // Start with prop defaults, overriding with scenario-given values
    for (const [key, prop] of tg.propEntries) {
        if (key === tg.lifecycleKey)
            continue; // lifecycle handled separately
        const scenarioValue = scenario.given[key];
        if (scenarioValue !== undefined) {
            parts.push(`${key}: ${valueToSource(scenarioValue)}`);
        }
        else if (!isOptional(prop)) {
            parts.push(`${key}: ${defaultValueForProp(prop)}`);
        }
    }
    // Lifecycle state
    if (tg.lifecycleKey) {
        parts.push(`${tg.lifecycleKey}: '${fromState}'`);
    }
    // Relation defaults
    for (const [fieldName, defaultValue] of tg.relationEntries) {
        parts.push(`${fieldName}: ${defaultValue}`);
    }
    return `{ ${parts.join(", ")} } satisfies ${tg.propsType}`;
};
const formatSuccessCase = (name, scenario, transition, tg) => {
    const fnName = `${tg.typeName}${capitalize(name)}`;
    const ctxLiteral = buildCtxLiteral(scenario, transition.from, tg);
    const givenStr = JSON.stringify(scenario.given);
    const lines = [
        `  it('given ${givenStr}, when ${name}, then ${tg.lifecycleKey ?? "transition"} = ${scenario.expected}', () => {`,
        `    const ctx = ${ctxLiteral};`,
        `    const result = ${fnName}(ctx);`,
    ];
    if (tg.lifecycleKey) {
        lines.push(`    expect(result.${tg.lifecycleKey}).toBe('${scenario.expected}');`);
    }
    else {
        lines.push(`    expect(result).toBeDefined();`);
    }
    lines.push(`  });`);
    return lines;
};
const formatFailureCase = (name, scenario, transition, tg) => {
    const fnName = `${tg.typeName}${capitalize(name)}`;
    const ctxLiteral = buildCtxLiteral(scenario, transition.from, tg);
    const givenStr = JSON.stringify(scenario.given);
    return [
        `  it('given ${givenStr}, when ${name}, then stays ${scenario.expected}', () => {`,
        `    const ctx = ${ctxLiteral};`,
        `    expect(() => ${fnName}(ctx)).toThrow();`,
        `  });`,
    ];
};
const formatScenario = (name, scenario, transition, tg) => {
    const succeeds = scenario.expected === transition.to;
    return succeeds
        ? formatSuccessCase(name, scenario, transition, tg)
        : formatFailureCase(name, scenario, transition, tg);
};
/** Generate unit tests from transition scenarios in Given/When/Then style. */
export const generateTests = (model) => {
    const transitions = getTransitions(model);
    if (transitions.length === 0)
        return "";
    const typeName = capitalize(model.name);
    const modelName = model.name.toLowerCase();
    const propsType = `${typeName}Props`;
    const lifecycleKey = getLifecycleProp(model)?.key;
    // Collect prop entries for building complete ctx objects
    const propEntries = model.props
        ? Object.entries(model.props)
        : [];
    // Build relation field entries
    const relations = getRelations(model);
    const relationEntries = [];
    for (const [key, rel] of relations) {
        const fieldName = relationIdField(key, rel.kind);
        const defaultValue = rel.kind === "belongsTo" ? "''" : "[]";
        relationEntries.push([fieldName, defaultValue]);
    }
    // Collect transition function names that have scenarios
    const transitionFnNames = [];
    for (const [name, transition] of transitions) {
        if (transition.scenarios && transition.scenarios.length > 0) {
            transitionFnNames.push(`${typeName}${capitalize(name)}`);
        }
    }
    if (transitionFnNames.length === 0)
        return "";
    const tg = {
        lifecycleKey,
        propEntries,
        propsType,
        relationEntries,
        typeName,
    };
    const lines = [];
    lines.push(`import { describe, it, expect } from 'vitest';`);
    // Import types for satisfies assertions
    lines.push(`import type { ${propsType} } from './${modelName}.types.js';`);
    // Convention: generated transition module lives at ./${modelName}.transitions.js
    lines.push(`import { ${transitionFnNames.join(", ")} } from './${modelName}.transitions.js';`);
    lines.push("");
    lines.push(`describe('${typeName}', () => {`);
    for (const [name, transition] of transitions) {
        if (!transition.scenarios || transition.scenarios.length === 0)
            continue;
        for (const scenario of transition.scenarios) {
            lines.push(...formatScenario(name, scenario, transition, tg));
            lines.push("");
        }
    }
    lines.push(`});`);
    lines.push("");
    return lines.join("\n");
};
//# sourceMappingURL=tests.js.map