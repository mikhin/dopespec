import { isOptional } from "./props.js";
const validateProp = (key, prop, label) => {
    if (prop.kind === "lifecycle")
        throw new Error(`decisions() ${label} "${key}" cannot be a lifecycle prop — use oneOf() instead`);
    if (isOptional(prop))
        throw new Error(`decisions() ${label} "${key}" cannot be optional — all ${label}s are required`);
};
const validateRuleWhen = (rule, index, inputKeys) => {
    for (const key of Object.keys(rule.when)) {
        if (!inputKeys.includes(key))
            throw new Error(`decisions() rule[${String(index)}].when key "${key}" is not a defined input`);
    }
};
const validateRuleThen = (rule, index, outputKeys) => {
    const thenKeys = Object.keys(rule.then);
    for (const key of thenKeys) {
        if (!outputKeys.includes(key))
            throw new Error(`decisions() rule[${String(index)}].then key "${key}" is not a defined output`);
    }
    for (const key of outputKeys) {
        if (!thenKeys.includes(key))
            throw new Error(`decisions() rule[${String(index)}].then is missing output key "${key}"`);
    }
};
// Implementation — callers see the public overload's return type, not this one.
// eslint-disable-next-line padding-line-between-statements -- overload implementation must be adjacent
export function decisions(name, config) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error("decisions() requires a non-empty name");
    const cfg = config;
    const inputKeys = Object.keys(cfg.inputs);
    const outputKeys = Object.keys(cfg.outputs);
    if (inputKeys.length === 0)
        throw new Error("decisions() requires at least one input");
    if (outputKeys.length === 0)
        throw new Error("decisions() requires at least one output");
    if (!cfg.rules || cfg.rules.length === 0)
        throw new Error("decisions() requires at least one rule");
    for (const [key, prop] of Object.entries(cfg.inputs))
        validateProp(key, prop, "input");
    for (const [key, prop] of Object.entries(cfg.outputs))
        validateProp(key, prop, "output");
    for (const [i, rule] of cfg.rules.entries()) {
        validateRuleWhen(rule, i, inputKeys);
        validateRuleThen(rule, i, outputKeys);
    }
    return {
        inputs: cfg.inputs,
        kind: "decision",
        name: trimmed,
        outputs: cfg.outputs,
        rules: cfg.rules,
    };
}
//# sourceMappingURL=decisions.js.map