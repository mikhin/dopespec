import { buildModelDefaults, capitalize, defaultValueForProp, guardToSource, relationIdField, resolvePolicyGuardBody, toKebabCase, } from "./utils.js";
/**
 * Generate integration tests for all policies targeting a single model.
 * Output: generated/${targetModel}.policy.test.ts
 */
export const generatePolicyTests = (targetModelName, policies, modelLookup) => {
    if (policies.length === 0)
        return "";
    const lines = [];
    const targetKey = toKebabCase(targetModelName);
    emitTestImports(lines, targetKey, policies);
    for (const policy of policies) {
        emitPolicyTestBlock(lines, policy, modelLookup);
    }
    return lines.join("\n");
};
/** Build a source-code object literal with default values for a model's props. */
function buildCtxSource(model) {
    if (!model?.props)
        return "{}";
    const entries = buildPropDefaults(model);
    return `{ ${entries.join(", ")} }`;
}
function buildOverriddenCtx(model, overrideProp, overrideValue) {
    const entries = [];
    if (model.props) {
        for (const [k, p] of Object.entries(model.props).sort(([a], [b]) => a.localeCompare(b))) {
            entries.push(k === overrideProp
                ? `${k}: '${overrideValue}'`
                : `${k}: ${defaultValueForProp(p)}`);
        }
    }
    if (model.relations) {
        for (const [k, rel] of Object.entries(model.relations).sort(([a], [b]) => a.localeCompare(b))) {
            const field = relationIdField(k, rel.kind);
            entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
        }
    }
    return `{ ${entries.join(", ")} }`;
}
function buildPropDefaults(model) {
    const entries = [];
    if (model.props) {
        for (const [key, prop] of Object.entries(model.props).sort(([a], [b]) => a.localeCompare(b))) {
            entries.push(`${key}: ${defaultValueForProp(prop)}`);
        }
    }
    if (model.relations) {
        for (const [key, rel] of Object.entries(model.relations).sort(([a], [b]) => a.localeCompare(b))) {
            const field = relationIdField(key, rel.kind);
            entries.push(rel.kind === "belongsTo" ? `${field}: ''` : `${field}: []`);
        }
    }
    return entries;
}
function emitPolicyTestBlock(lines, policy, modelLookup) {
    const policyName = capitalize(policy.name);
    const validateFn = `validate${policyName}`;
    const requiresModels = resolveRequiresModels(policy, modelLookup);
    lines.push(`describe('${policy.name}', () => {`);
    for (const [i, rule] of policy.rules.entries()) {
        if (i > 0)
            lines.push("");
        emitRuleTest(lines, i, rule, policy, validateFn, requiresModels, modelLookup);
    }
    lines.push(`});`);
    lines.push("");
}
function emitRuleTest(lines, index, rule, policy, validateFn, requiresModels, modelLookup) {
    const rawBody = guardToSource(rule.when);
    const guardBody = resolvePolicyGuardBody(rule.when, rawBody, requiresModels);
    const ruleId = `${policy.name}:rule_${String(index)}`;
    // Guard body in test description for readability; stable ID in assertion
    const escapedBody = guardBody.replace(/'/g, "\\'");
    lines.push(`  it('${ruleId}: ${escapedBody} → ${rule.effect}', () => {`);
    // Build context
    lines.push(`    const ctx = {`);
    const onModel = modelLookup.get(policy.on.model.name);
    lines.push(`      ${policy.on.model.name.toLowerCase()}: ${buildCtxSource(onModel)},`);
    for (const [key, rel] of Object.entries(policy.requires)) {
        const model = requiresModels[key];
        if (rel.kind === "hasMany") {
            lines.push(`      ${key}: [${buildCtxSource(model)}],`);
        }
        else {
            lines.push(`      ${key}: ${findTriggerValues(rule.when, key, model)},`);
        }
    }
    lines.push(`    };`);
    lines.push(`    const result = ${validateFn}(ctx);`);
    if (rule.effect === "prevent") {
        lines.push(`    expect(result.valid).toBe(false);`);
        lines.push(`    expect(result.violations).toContain('${ruleId}');`);
    }
    else {
        lines.push(`    expect(result.warnings).toContain('${ruleId}');`);
    }
    lines.push(`  });`);
}
function emitTestImports(lines, targetKey, policies) {
    lines.push(`import { describe, it, expect } from 'vitest';`);
    const validatorImports = policies
        .map((p) => `validate${capitalize(p.name)}`)
        .join(", ");
    lines.push(`import { ${validatorImports} } from './${targetKey}.policies.js';`);
    const contextImports = policies
        .map((p) => `${capitalize(p.name)}Context`)
        .join(", ");
    lines.push(`import type { ${contextImports} } from './${targetKey}.policies.js';`);
    lines.push("");
}
function findTriggerEntry(guard, reqKey, model, defaults) {
    if (!model.props)
        return undefined;
    for (const [propName, prop] of Object.entries(model.props)) {
        const probeValues = probeValuesForProp(prop);
        for (const value of probeValues) {
            try {
                const ctx = { [reqKey]: { ...defaults, [propName]: value } };
                if (guard(ctx) === true)
                    return { propName, value: String(value) };
            }
            catch {
                /* guard may access props not yet available */
            }
        }
    }
    return undefined;
}
/**
 * Find prop values that trigger a policy rule's guard for a specific requires key.
 * Probes the guard with different enum/boolean values to find which one returns true.
 *
 * Limitation: probes one requires key at a time. Guards that check multiple keys
 * (e.g. ctx.customer.status === 'x' && ctx.orders.length > 5) may not trigger
 * during single-key probing — falls back to default values in that case.
 */
function findTriggerValues(guard, reqKey, model) {
    if (!model?.props)
        return "{}";
    const defaults = buildModelDefaults(model);
    const triggerEntry = findTriggerEntry(guard, reqKey, model, defaults);
    if (!triggerEntry)
        return buildCtxSource(model);
    return buildOverriddenCtx(model, triggerEntry.propName, triggerEntry.value);
}
/**
 * Probe values for a prop kind. Lifecycle/oneOf use their declared values,
 * boolean tries true/false, other kinds are not probed.
 */
function probeValuesForProp(prop) {
    if (prop.kind === "lifecycle" || prop.kind === "oneOf")
        return prop.values;
    if (prop.kind === "boolean")
        return [true, false];
    return [];
}
function resolveRequiresModels(policy, modelLookup) {
    const result = {};
    for (const [key, rel] of Object.entries(policy.requires)) {
        const model = modelLookup.get(rel.target.name);
        if (model)
            result[key] = model;
    }
    return result;
}
//# sourceMappingURL=policy-tests.js.map