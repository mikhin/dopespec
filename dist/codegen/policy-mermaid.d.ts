import type { PolicyDef } from "../schema/policy.js";
/**
 * Generate Mermaid interaction diagram for all policies targeting a single model.
 * Output: generated/${targetModel}.policy-mermaid.md
 */
export declare const generatePolicyMermaid: (targetModelName: string, policies: PolicyDef[]) => string;
//# sourceMappingURL=policy-mermaid.d.ts.map