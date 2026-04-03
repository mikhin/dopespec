import { createTypedRule } from "./constraints.js";
import { createTypedFrom } from "./transitions.js";
// Implementation — callers see the public overload's return type, not this one.
// The phantom ModelRef brand exists only at the type level.
// eslint-disable-next-line padding-line-between-statements -- overload implementation must be adjacent
export function model(name, config) {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error("model() requires a non-empty name");
    const cfg = config;
    const transitions = cfg.transitions
        ? cfg.transitions({ from: createTypedFrom() })
        : undefined;
    const constraints = cfg.constraints
        ? cfg.constraints({ rule: createTypedRule() })
        : undefined;
    const result = { kind: "model", name: trimmed };
    if (cfg.props !== undefined)
        result["props"] = cfg.props;
    if (cfg.actions !== undefined)
        result["actions"] = cfg.actions;
    if (cfg.relations !== undefined)
        result["relations"] = cfg.relations;
    if (transitions !== undefined)
        result["transitions"] = transitions;
    if (constraints !== undefined)
        result["constraints"] = constraints;
    return result;
}
//# sourceMappingURL=model.js.map