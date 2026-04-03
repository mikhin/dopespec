const VALID_EFFECTS = new Set(["prevent", "warn"]);
// Implementation — callers see the public overload's return type, not this one.
// eslint-disable-next-line padding-line-between-statements -- overload implementation must be adjacent
export function policy(name, config) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error("policy() requires a non-empty name");
    const cfg = config;
    const action = validateOn(cfg.on);
    validateRequires(cfg.requires);
    validateRules(cfg.rules);
    return {
        kind: "policy",
        name: trimmed,
        on: { action, model: cfg.on.model },
        requires: cfg.requires,
        rules: cfg.rules,
    };
}
function validateOn(on) {
    if (!on || typeof on !== "object" || !on.model || on.model.kind !== "model")
        throw new Error("policy() on.model must be a model() or ref() reference");
    const action = typeof on.action === "string" ? on.action.trim() : "";
    if (!action)
        throw new Error("policy() on.action must be a non-empty string");
    // Validate action exists on target model (skip for ref() — model not yet defined)
    const modelActions = on.model["actions"];
    if (modelActions && !Object.keys(modelActions).includes(action))
        throw new Error(`policy() on.action "${action}" is not a defined action on model "${on.model.name}"`);
    return action;
}
function validateRequires(requires) {
    const keys = Object.keys(requires ?? {});
    if (keys.length === 0)
        throw new Error("policy() requires at least one entry in requires");
    for (const [key, rel] of Object.entries(requires ?? {})) {
        if (!rel ||
            typeof rel !== "object" ||
            (rel.kind !== "belongsTo" && rel.kind !== "hasMany"))
            throw new Error(`policy() requires["${key}"] must be a belongsTo() or hasMany() relation`);
    }
}
function validateRules(rules) {
    if (!rules || rules.length === 0)
        throw new Error("policy() requires at least one rule");
    for (const [i, rule] of rules.entries()) {
        if (typeof rule.when !== "function")
            throw new Error(`policy() rules[${String(i)}].when must be a function`);
        if (!VALID_EFFECTS.has(rule.effect))
            throw new Error(`policy() rules[${String(i)}].effect must be "prevent" or "warn"`);
    }
}
//# sourceMappingURL=policy.js.map