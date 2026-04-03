import type { ModelRef } from "./types.js";
export type RelationDef<K extends RelationKind = RelationKind> = {
    readonly kind: K;
    readonly target: ModelRef;
};
export type RelationKind = "belongsTo" | "hasMany";
export declare const hasMany: (target: ModelRef) => RelationDef<"hasMany">;
export declare const belongsTo: (target: ModelRef) => RelationDef<"belongsTo">;
//# sourceMappingURL=relations.d.ts.map