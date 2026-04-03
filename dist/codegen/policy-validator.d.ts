import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";
/**
 * Generate policy validator functions for all policies targeting a single model.
 * Output: generated/${targetModel}.policies.ts
 */
export declare const generatePolicyValidator: (policies: PolicyDef[], modelLookup: Map<string, ModelDef>) => string;
//# sourceMappingURL=policy-validator.d.ts.map