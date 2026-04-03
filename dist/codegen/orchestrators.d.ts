import type { ModelDef } from "../schema/model.js";
/**
 * Generate service orchestrator skeletons from a model's actions.
 * @param policyActions — optional map of action → policy names for TODO comments
 */
export declare const generateOrchestrators: (model: ModelDef, policyActions?: Map<string, string[]>) => string;
//# sourceMappingURL=orchestrators.d.ts.map