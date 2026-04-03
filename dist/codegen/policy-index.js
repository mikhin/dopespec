import { capitalize } from "./utils.js";
/**
 * Generate a policy index listing all policies per model+action.
 * Output: generated/policy-index.ts
 */
export const generatePolicyIndex = (policies) => {
    if (policies.length === 0)
        return "";
    // Group: model → action → policy names
    const index = new Map();
    for (const policy of policies) {
        const modelName = capitalize(policy.on.model.name);
        const action = policy.on.action;
        let actions = index.get(modelName);
        if (!actions) {
            actions = new Map();
            index.set(modelName, actions);
        }
        let policyNames = actions.get(action);
        if (!policyNames) {
            policyNames = [];
            actions.set(action, policyNames);
        }
        policyNames.push(policy.name);
    }
    const lines = [];
    lines.push(`export const policyIndex = {`);
    for (const [modelName, actions] of [...index].sort(([a], [b]) => a.localeCompare(b))) {
        lines.push(`  ${modelName}: {`);
        for (const [action, policyNames] of [...actions].sort(([a], [b]) => a.localeCompare(b))) {
            const names = policyNames.map((n) => `'${n}'`).join(", ");
            lines.push(`    ${action}: [${names}],`);
        }
        lines.push(`  },`);
    }
    lines.push(`} as const;`);
    lines.push("");
    return lines.join("\n");
};
//# sourceMappingURL=policy-index.js.map