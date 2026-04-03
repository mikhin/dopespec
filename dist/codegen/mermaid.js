import { getLifecycleProp, getTransitions } from "./utils.js";
/** Generate Mermaid stateDiagram from a model's transitions. */
export const generateMermaid = (model) => {
    const transitions = getTransitions(model);
    if (transitions.length === 0)
        return "";
    const lifecycle = getLifecycleProp(model);
    const lines = [];
    lines.push(`stateDiagram-v2`);
    // Initial state arrow
    if (lifecycle && lifecycle.values.length > 0) {
        lines.push(`  [*] --> ${lifecycle.values[0]}`);
    }
    for (const [name, transition] of transitions) {
        const label = transition.guard ? `${name} [guarded]` : name;
        lines.push(`  ${transition.from} --> ${transition.to}: ${label}`);
    }
    lines.push("");
    return lines.join("\n");
};
//# sourceMappingURL=mermaid.js.map