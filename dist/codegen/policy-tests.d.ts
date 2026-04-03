import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";
/**
 * Generate integration tests for all policies targeting a single model.
 * Output: generated/${targetModel}.policy.test.ts
 */
export declare const generatePolicyTests: (targetModelName: string, policies: PolicyDef[], modelLookup: Map<string, ModelDef>) => string;
//# sourceMappingURL=policy-tests.d.ts.map