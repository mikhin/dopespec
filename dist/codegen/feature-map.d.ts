import type { DecisionDef } from "../schema/decisions.js";
import type { ModelDef } from "../schema/model.js";
import type { PolicyDef } from "../schema/policy.js";
export type FeatureConstruct = DecisionDef | ModelDef | PolicyDef;
export type FeatureEntry = {
    /** Grouping label — the construct's `area`, or a folder-derived fallback. */
    area: string;
    def: FeatureConstruct;
};
/**
 * Aggregate Mermaid feature map across every construct, grouped by area.
 * Each construct is a node; its actions / transitions / rules are leaves.
 * Complements the per-construct diagrams produced by `generate`.
 */
export declare const generateFeatureMap: (entries: FeatureEntry[], options?: {
    title?: string;
}) => string;
//# sourceMappingURL=feature-map.d.ts.map